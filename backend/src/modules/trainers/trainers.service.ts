import { Injectable } from '@nestjs/common';
import { Prisma, type Trainer, type User } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { assertFound } from '../../common/ownership/ownership';
import { PrismaService } from '../../prisma/prisma.service';
import { toSubscriptionSummary, toVnDateTime } from '../members/member.response';
import type {
  AvailabilityQueryDto,
  ListTrainerMembersQueryDto,
  ListTrainersQueryDto,
  ReplaceAvailabilityDto,
  UpdateTrainerDto,
} from './dto/trainer.dto';

/** GET availability: không gửi `to` thì lấy from + 27 ngày (4 tuần); khoảng tối đa 35 ngày (openapi). */
const DEFAULT_RANGE_DAYS = 28;
const MAX_RANGE_DAYS = 35;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Ký tự đặc biệt của LIKE phải thoát để tìm đúng chữ người dùng gõ. */
const escapeLike = (s: string): string => s.replace(/[\\%_]/g, (c) => `\\${c}`);

const fieldError = (field: string, message: string) =>
  new AppError('VALIDATION_ERROR', [{ field, messages: [message] }]);

/** Đầu ngày theo giờ Việt Nam của chuỗi YYYY-MM-DD. */
const vnDayStart = (day: string): Date => new Date(`${day}T00:00:00+07:00`);
const vnToday = (): string => toVnDateTime(new Date()).slice(0, 10);
const addDays = (day: string, n: number): string =>
  new Date(vnDayStart(day).getTime() + n * DAY_MS + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** Schema `Trainer` trong openapi: hồ sơ công khai, không có SĐT, email. */
export type TrainerResponse = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  specialties: string[];
  bio: string | null;
  experienceYears: number | null;
  status: Trainer['status'];
};

const toTrainerResponse = (t: Trainer & { user: User }): TrainerResponse => ({
  id: t.id,
  userId: t.userId,
  fullName: t.user.fullName,
  avatarUrl: t.user.avatarUrl,
  specialties: t.specialties,
  bio: t.bio,
  experienceYears: t.experienceYears,
  status: t.status,
});

@Injectable()
export class TrainersService {
  constructor(private readonly prisma: PrismaService) {}

  /** UC21. Khách, hội viên chỉ thấy ACTIVE; Admin thấy cả INACTIVE và lọc status. Tên A→Z. */
  async list(query: ListTrainersQueryDto, user?: AuthUser) {
    // Người thôi làm PT có hồ sơ INACTIVE (PATCH /users/{id}/role), nên khách không thấy; Admin thấy như PT ngừng nhận lịch
    const conditions: Prisma.TrainerWhereInput[] = [];
    if (user?.role === 'ADMIN') {
      if (query.status) conditions.push({ status: query.status });
    } else {
      conditions.push({ status: 'ACTIVE' });
    }
    if (query.specialty) conditions.push({ specialties: { has: query.specialty } });
    if (query.q) {
      const pattern = `%${escapeLike(query.q)}%`;
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT t.id FROM trainers t JOIN users u ON u.id = t.user_id
        WHERE immutable_unaccent(lower(u.full_name)) LIKE immutable_unaccent(lower(${pattern}))`;
      conditions.push({ id: { in: rows.map((r) => r.id) } });
    }

    const where: Prisma.TrainerWhereInput = { AND: conditions };
    const { page, pageSize } = query;
    const [total, trainers] = await this.prisma.$transaction([
      this.prisma.trainer.count({ where }),
      this.prisma.trainer.findMany({
        where,
        include: { user: true },
        orderBy: [{ user: { fullName: 'asc' } }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      data: trainers.map(toTrainerResponse),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /** UC21. Hồ sơ INACTIVE vẫn xem được. */
  async get(id: string): Promise<TrainerResponse> {
    return toTrainerResponse(await this.findOrThrow(id));
  }

  /** UC33. fullName lưu ở users; còn lại ở trainers. Cập nhật hai bảng trong một transaction. */
  async update(id: string, dto: UpdateTrainerDto): Promise<TrainerResponse> {
    // DTO có sẵn mọi field (giá trị undefined), nên đếm field được gửi chứ không đếm key
    if (Object.values(dto).every((v) => v === undefined)) {
      throw fieldError('body', 'Cần ít nhất một field');
    }
    const existing = await this.findOrThrow(id);
    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.fullName !== undefined) {
        await tx.user.update({ where: { id: existing.userId }, data: { fullName: dto.fullName } });
      }
      return tx.trainer.update({
        where: { id: existing.id },
        data: {
          specialties: dto.specialties,
          bio: dto.bio,
          experienceYears: dto.experienceYears,
          status: dto.status,
        },
        include: { user: true },
      });
    });
    return toTrainerResponse(updated);
  }

  /** UC22, UC23. Khung rảnh và giờ bận (lịch CONFIRMED, lớp SCHEDULED) trong khoảng, không kèm hội viên. */
  async getAvailability(id: string, query: AvailabilityQueryDto) {
    const trainer = await this.findOrThrow(id);
    const from = query.from ?? vnToday();
    const to = query.to ?? addDays(from, DEFAULT_RANGE_DAYS - 1);
    this.assertRange(from, to, MAX_RANGE_DAYS);
    return this.loadAvailability(trainer.id, from, to);
  }

  /**
   * UC22, quyết định 14. Thay toàn bộ khoảng nằm trong from..to bằng `slots`; ngoài khoảng giữ nguyên.
   * Không đụng lịch đã có. PT gửi cho PT khác: 404 (quy ước "của mình").
   */
  async replaceAvailability(id: string, dto: ReplaceAvailabilityDto, user: AuthUser) {
    const trainer = await this.findOwnOrThrow(id, user);
    this.assertRange(dto.from, dto.to);
    const rangeStart = vnDayStart(dto.from);
    const rangeEnd = vnDayStart(addDays(dto.to, 1));

    const slots = dto.slots.map((s, i) => {
      const startsAt = new Date(s.startsAt);
      const endsAt = new Date(s.endsAt);
      if (endsAt <= startsAt) throw fieldError(`slots[${i}].endsAt`, 'endsAt phải sau startsAt');
      if (startsAt < rangeStart || endsAt > rangeEnd) {
        throw fieldError(`slots[${i}].startsAt`, 'Khoảng phải nằm trong from..to');
      }
      return { i, startsAt, endsAt };
    });
    const sorted = [...slots].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    for (let k = 1; k < sorted.length; k++) {
      if (sorted[k].startsAt < sorted[k - 1].endsAt) {
        throw fieldError(`slots[${sorted[k].i}].startsAt`, `Chồng giờ với slots[${sorted[k - 1].i}]`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.trainerAvailability.deleteMany({
        where: { trainerId: trainer.id, startsAt: { gte: rangeStart }, endsAt: { lte: rangeEnd } },
      });
      // Còn lại trong khoảng chỉ có khung cũ vắt qua mép from/to (không bị thay); khung mới chồng lên thì báo đúng slots[i]
      const edges = await tx.trainerAvailability.findMany({
        where: { trainerId: trainer.id, startsAt: { lt: rangeEnd }, endsAt: { gt: rangeStart } },
      });
      const clash = sorted.find((s) => edges.some((e) => s.startsAt < e.endsAt && e.startsAt < s.endsAt));
      if (clash) {
        throw fieldError(
          `slots[${clash.i}].startsAt`,
          'Chồng giờ với khung rảnh đã có ngoài khoảng from..to',
        );
      }
      if (sorted.length) {
        // Exclusion constraint trong DB vẫn chặn nếu hai yêu cầu cùng lúc lọt qua bước trên
        await tx.trainerAvailability.createMany({
          data: sorted.map((s) => ({ trainerId: trainer.id, startsAt: s.startsAt, endsAt: s.endsAt })),
        });
      }
    });
    return this.loadAvailability(trainer.id, dto.from, dto.to);
  }

  /**
   * UC28, quyết định 16. Hội viên có lịch PENDING/CONFIRMED/COMPLETED với PT này,
   * kèm gói PT ACTIVE/FROZEN (số buổi tính sẵn) và buổi sắp tới gần nhất. Buổi sắp tới gần nhất trước.
   */
  async listMembers(id: string, query: ListTrainerMembersQueryDto, user: AuthUser) {
    const trainer = await this.findOwnOrThrow(id, user);
    const { page, pageSize } = query;
    const search = query.q
      ? Prisma.sql`AND (immutable_unaccent(lower(u.full_name)) LIKE immutable_unaccent(lower(${`%${escapeLike(query.q)}%`}))
          OR u.phone LIKE ${`%${escapeLike(query.q)}%`}
          OR lower(m.member_code) LIKE lower(${`%${escapeLike(query.q)}%`}))`
      : Prisma.empty;

    const base = Prisma.sql`
      FROM members m
      JOIN users u ON u.id = m.user_id
      JOIN appointments a ON a.member_id = m.id AND a.trainer_id = ${trainer.id}::uuid
        AND a.status IN ('PENDING', 'CONFIRMED', 'COMPLETED')
      WHERE true ${search}`;

    const [{ total }] = await this.prisma.$queryRaw<{ total: bigint }[]>`
      SELECT count(DISTINCT m.id) AS total ${base}`;
    const rows = await this.prisma.$queryRaw<{ id: string; next: Date | null }[]>`
      SELECT m.id,
        min(a.starts_at) FILTER (WHERE a.status IN ('PENDING', 'CONFIRMED') AND a.starts_at > now()) AS next
      ${base}
      GROUP BY m.id, u.full_name
      ORDER BY next ASC NULLS LAST, u.full_name ASC, m.id ASC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const ids = rows.map((r) => r.id);
    const members = await this.prisma.member.findMany({
      where: { id: { in: ids } },
      include: {
        user: true,
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'FROZEN'] }, totalSessions: { not: null } },
          orderBy: [{ endsOn: 'asc' }, { id: 'asc' }],
          include: { package: { select: { type: true } } },
        },
      },
    });
    const subIds = members.flatMap((m) => m.subscriptions.map((s) => s.id));
    const groups = subIds.length
      ? await this.prisma.appointment.groupBy({
          by: ['subscriptionId', 'status'],
          where: { subscriptionId: { in: subIds } },
          _count: { _all: true },
        })
      : [];
    const countsOf = (subscriptionId: string) =>
      Object.fromEntries(
        groups.filter((g) => g.subscriptionId === subscriptionId).map((g) => [g.status, g._count._all]),
      );
    const byId = new Map(members.map((m) => [m.id, m]));
    const totalNumber = Number(total);

    return {
      data: rows.map((r) => {
        const m = byId.get(r.id)!;
        return {
          member: {
            id: m.id,
            memberCode: m.memberCode,
            fullName: m.user.fullName,
            phone: m.user.phone,
            avatarUrl: m.user.avatarUrl,
          },
          subscriptions: m.subscriptions.map((s) => toSubscriptionSummary(s, countsOf(s.id))),
          nextAppointmentAt: r.next ? toVnDateTime(r.next) : null,
        };
      }),
      meta: { page, pageSize, total: totalNumber, totalPages: Math.ceil(totalNumber / pageSize) },
    };
  }

  private async loadAvailability(trainerId: string, from: string, to: string) {
    const rangeStart = vnDayStart(from);
    const rangeEnd = vnDayStart(addDays(to, 1));
    const overlaps = { startsAt: { lt: rangeEnd }, endsAt: { gt: rangeStart } };
    const [slots, appointments, classes] = await Promise.all([
      this.prisma.trainerAvailability.findMany({
        where: { trainerId, ...overlaps },
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.appointment.findMany({
        where: { trainerId, status: 'CONFIRMED', ...overlaps },
        select: { startsAt: true, endsAt: true },
      }),
      this.prisma.class.findMany({
        where: { trainerId, status: 'SCHEDULED', ...overlaps },
        select: { startsAt: true, endsAt: true },
      }),
    ]);
    const busy = [...appointments, ...classes]
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .map((b) => ({ startsAt: toVnDateTime(b.startsAt), endsAt: toVnDateTime(b.endsAt) }));
    return {
      trainerId,
      from,
      to,
      slots: slots.map((s) => ({
        id: s.id,
        startsAt: toVnDateTime(s.startsAt),
        endsAt: toVnDateTime(s.endsAt),
      })),
      busy,
    };
  }

  /** from ≤ to; nếu có maxDays thì số ngày (tính cả hai đầu) không vượt. */
  private assertRange(from: string, to: string, maxDays?: number) {
    if (to < from) throw fieldError('to', 'to phải từ from trở đi');
    const days = (vnDayStart(to).getTime() - vnDayStart(from).getTime()) / DAY_MS + 1;
    if (maxDays !== undefined && days > maxDays) {
      throw fieldError('to', `Khoảng tối đa ${maxDays} ngày`);
    }
  }

  private async findOrThrow(id: string) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const trainer = await this.prisma.trainer.findFirst({
      where: { id },
      include: { user: true },
    });
    assertFound(trainer);
    return trainer;
  }

  /** TRAINER chỉ thao tác trên hồ sơ của mình; của PT khác trả 404 (common/ownership). */
  private async findOwnOrThrow(id: string, user: AuthUser) {
    const trainer = await this.findOrThrow(id);
    if (user.role === 'TRAINER' && trainer.userId !== user.id) throw new AppError('NOT_FOUND');
    return trainer;
  }
}
