import { Injectable } from '@nestjs/common';
import { Prisma, type AppointmentStatus } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AppError } from '../../common/errors/app-error';
import { isEmptyPatch } from '../../common/http/patch';
import type { AuthUser } from '../../common/http/request-context';
import { isExclusionViolation, pageMeta } from '../../common/notify';
import { assertFound } from '../../common/ownership/ownership';
import { addDays, todayVn, vnDayEnd, vnDayStart } from '../../common/time/vn-date';
import { PrismaService } from '../../prisma/prisma.service';
import { toSubscriptionSummary, toVnDateTime } from '../members/member.response';
import { toMemberRef } from '../orders/order.response';
import type {
  AvailabilityQueryDto,
  ListTrainersQueryDto,
  ReplaceAvailabilityDto,
  TrainerMembersQueryDto,
  UpdateTrainerDto,
} from './dto/trainer.dto';
import { toTimeRange, toTrainerResponse } from './trainer.response';

/** openapi: không gửi `to` thì lấy `from` + 27 ngày (4 tuần); khoảng tối đa 35 ngày. */
const DEFAULT_DAYS = 28;
const MAX_DAYS = 35;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Quyết định 16: PT phụ trách hội viên khi có lịch PENDING/CONFIRMED/COMPLETED với PT đó. */
const RESPONSIBLE: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED'];

const escapeLike = (s: string): string => s.replace(/[\\%_]/g, (c) => `\\${c}`);
const fieldError = (field: string, message: string) =>
  new AppError('VALIDATION_ERROR', [{ field, messages: [message] }], message);

@Injectable()
export class TrainersService {
  constructor(private readonly prisma: PrismaService) {}

  /** UC21. Khách, hội viên chỉ thấy PT ACTIVE; Admin thấy cả INACTIVE và lọc được `status`. Tên A→Z. */
  async list(query: ListTrainersQueryDto, user: AuthUser | undefined) {
    const isAdmin = user?.role === 'ADMIN';
    const conditions: Prisma.TrainerWhereInput[] = [
      { status: isAdmin ? query.status : 'ACTIVE' },
      query.specialty ? { specialties: { has: query.specialty } } : {},
    ];
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
    return { data: trainers.map(toTrainerResponse), meta: pageMeta(page, pageSize, total) };
  }

  /** UC21. Hồ sơ INACTIVE vẫn xem được (mở lại link cũ). */
  async get(id: string) {
    return toTrainerResponse(await this.load(id));
  }

  /** UC33. `fullName` lưu ở users; INACTIVE thì PT ngừng nhận lịch mới. */
  async update(id: string, dto: UpdateTrainerDto) {
    if (isEmptyPatch(dto)) throw fieldError('body', 'Cần gửi ít nhất một field');
    const current = await this.load(id);
    const { fullName, ...fields } = dto;
    const trainer = await this.prisma.$transaction(async (tx) => {
      if (fullName !== undefined) {
        await tx.user.update({ where: { id: current.userId }, data: { fullName } });
      }
      return tx.trainer.update({ where: { id }, data: fields, include: { user: true } });
    });
    return toTrainerResponse(trainer);
  }

  /** UC22, UC23. Khung giờ rảnh và giờ bận (lịch CONFIRMED, lớp SCHEDULED), không kèm thông tin hội viên. */
  async availability(id: string, query: AvailabilityQueryDto) {
    const trainer = await this.load(id);
    const from = query.from ?? todayVn();
    const to = query.to ?? addDays(from, DEFAULT_DAYS - 1);
    const days =
      (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / DAY_MS + 1;
    if (days < 1) throw fieldError('to', 'to phải sau hoặc bằng from');
    if (days > MAX_DAYS) throw fieldError('to', `Khoảng tối đa ${MAX_DAYS} ngày`);

    const start = vnDayStart(from);
    const end = vnDayEnd(to);
    const overlaps = { startsAt: { lt: end }, endsAt: { gt: start } };
    const [slots, appointments, classes] = await Promise.all([
      this.prisma.trainerAvailability.findMany({
        where: { trainerId: trainer.id, ...overlaps },
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.appointment.findMany({
        where: { trainerId: trainer.id, status: 'CONFIRMED', ...overlaps },
        select: { startsAt: true, endsAt: true },
      }),
      this.prisma.class.findMany({
        where: { trainerId: trainer.id, status: 'SCHEDULED', ...overlaps },
        select: { startsAt: true, endsAt: true },
      }),
    ]);
    const busy = [...appointments, ...classes].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    return {
      trainerId: trainer.id,
      from,
      to,
      slots: slots.map((s) => ({ id: s.id, ...toTimeRange(s) })),
      busy: busy.map(toTimeRange),
    };
  }

  /**
   * UC22, quyết định 14. Thay toàn bộ khoảng của PT nằm trong from..to bằng `slots`; ngoài khoảng giữ nguyên.
   * PT chỉ sửa của mình (khác thì 404). Lịch đã có không bị ảnh hưởng.
   */
  async replaceAvailability(id: string, dto: ReplaceAvailabilityDto, user: AuthUser) {
    const trainer = await this.load(id);
    if (user.role === 'TRAINER' && trainer.userId !== user.id) throw new AppError('NOT_FOUND');

    const start = vnDayStart(dto.from);
    const end = vnDayEnd(dto.to);
    if (end <= start) throw fieldError('to', 'to phải sau hoặc bằng from');

    const ranges = dto.slots.map((s, i) => ({
      i,
      startsAt: new Date(s.startsAt),
      endsAt: new Date(s.endsAt),
    }));
    const errors: { field: string; messages: string[] }[] = [];
    for (const r of ranges) {
      if (r.endsAt <= r.startsAt)
        errors.push({ field: `slots[${r.i}].endsAt`, messages: ['endsAt phải sau startsAt'] });
      if (r.startsAt < start || r.endsAt > end) {
        errors.push({ field: `slots[${r.i}].startsAt`, messages: ['Khoảng phải nằm trong from..to'] });
      }
    }
    const sorted = [...ranges].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    for (let k = 1; k < sorted.length; k += 1) {
      const prev = sorted[k - 1];
      const cur = sorted[k];
      if (prev && cur && cur.startsAt < prev.endsAt) {
        errors.push({ field: `slots[${cur.i}].startsAt`, messages: ['Các khoảng không được chồng nhau'] });
      }
    }
    if (errors.length > 0) throw new AppError('VALIDATION_ERROR', errors, 'Khung giờ không hợp lệ');

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.trainerAvailability.deleteMany({
          where: { trainerId: trainer.id, startsAt: { gte: start, lte: end } },
        });
        await tx.trainerAvailability.createMany({
          data: ranges.map((r) => ({ trainerId: trainer.id, startsAt: r.startsAt, endsAt: r.endsAt })),
        });
      });
    } catch (e) {
      // Chồng với khoảng nằm ngoài from..to (ràng buộc EXCLUDE trong DB)
      if (isExclusionViolation(e))
        throw fieldError('slots', 'Khoảng bị chồng với khung giờ đã có ngoài from..to');
      throw e;
    }
    return this.availability(id, { from: dto.from, to: dto.to });
  }

  /**
   * UC28. Hội viên PT phụ trách (quyết định 16), kèm gói PT ACTIVE/FROZEN có số buổi và buổi sắp tới.
   * Buổi sắp tới gần nhất trước; không có buổi sắp tới thì xếp sau.
   */
  async members(id: string, query: TrainerMembersQueryDto, user: AuthUser) {
    const trainer = await this.load(id);
    if (user.role === 'TRAINER' && trainer.userId !== user.id) throw new AppError('NOT_FOUND');

    const conditions: Prisma.MemberWhereInput[] = [
      { appointments: { some: { trainerId: trainer.id, status: { in: RESPONSIBLE } } } },
    ];
    if (query.q) {
      const pattern = `%${escapeLike(query.q)}%`;
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT m.id FROM members m JOIN users u ON u.id = m.user_id
        WHERE immutable_unaccent(lower(u.full_name)) LIKE immutable_unaccent(lower(${pattern}))
           OR u.phone LIKE ${pattern}
           OR lower(m.member_code) LIKE lower(${pattern})`;
      conditions.push({ id: { in: rows.map((r) => r.id) } });
    }

    const now = new Date();
    const members = await this.prisma.member.findMany({
      where: { AND: conditions },
      include: {
        user: true,
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'FROZEN'] }, package: { type: 'PT' } },
          include: { package: { select: { type: true } } },
          orderBy: { endsOn: 'asc' },
        },
        appointments: {
          where: { trainerId: trainer.id, status: { in: ['PENDING', 'CONFIRMED'] }, startsAt: { gt: now } },
          orderBy: { startsAt: 'asc' },
          take: 1,
          select: { startsAt: true },
        },
      },
    });

    const subscriptionIds = members.flatMap((m) => m.subscriptions.map((s) => s.id));
    const counts = await this.prisma.appointment.groupBy({
      by: ['subscriptionId', 'status'],
      where: { subscriptionId: { in: subscriptionIds } },
      _count: { _all: true },
    });
    const countsBySub = new Map<string, Partial<Record<AppointmentStatus, number>>>();
    for (const row of counts) {
      const entry = countsBySub.get(row.subscriptionId) ?? {};
      entry[row.status] = row._count._all;
      countsBySub.set(row.subscriptionId, entry);
    }

    const rows = members
      .map((m) => ({
        member: toMemberRef(m),
        subscriptions: m.subscriptions.map((s) => toSubscriptionSummary(s, countsBySub.get(s.id) ?? {})),
        next: m.appointments[0]?.startsAt ?? null,
      }))
      .sort((a, b) => {
        if (a.next && b.next) return a.next.getTime() - b.next.getTime();
        if (a.next) return -1;
        if (b.next) return 1;
        return a.member.fullName.localeCompare(b.member.fullName, 'vi');
      });

    const { page, pageSize } = query;
    return {
      data: rows.slice((page - 1) * pageSize, page * pageSize).map(({ next, ...r }) => ({
        ...r,
        nextAppointmentAt: next ? toVnDateTime(next) : null,
      })),
      meta: pageMeta(page, pageSize, rows.length),
    };
  }

  private async load(id: string) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const trainer = await this.prisma.trainer.findUnique({ where: { id }, include: { user: true } });
    assertFound(trainer);
    return trainer;
  }
}
