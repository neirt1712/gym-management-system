import { Injectable } from '@nestjs/common';
import { Prisma, type AppointmentStatus } from '@prisma/client';
import { isUUID } from 'class-validator';
import { randomBytes } from 'crypto';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { assertFound } from '../../common/ownership/ownership';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateMemberDto } from './dto/create-member.dto';
import type { ListMembersQueryDto } from './dto/list-members-query.dto';
import type { UpdateMemberDto } from './dto/update-member.dto';
import {
  fromDateOnly,
  toMemberResponse,
  toSubscriptionSummary,
  toVnDateTime,
  type MemberDetailResponse,
} from './member.response';

/** Quyết định 16: PT phụ trách hội viên khi có lịch PENDING/CONFIRMED/COMPLETED với PT đó. */
const RESPONSIBLE_STATUSES: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED'];

/** Ký tự đặc biệt của LIKE phải thoát để tìm đúng chữ người dùng gõ. */
const escapeLike = (s: string): string => s.replace(/[\\%_]/g, (c) => `\\${c}`);

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  /** STAFF, ADMIN thấy mọi hội viên; TRAINER chỉ thấy hội viên mình phụ trách. */
  private scopeFor(user: AuthUser): Prisma.MemberWhereInput {
    if (user.role !== 'TRAINER') return {};
    return {
      appointments: { some: { trainer: { userId: user.id }, status: { in: RESPONSIBLE_STATUSES } } },
    };
  }

  /** UC19, UC28. Tìm theo tên không dấu, SĐT hoặc mã; tạo mới nhất trước. */
  async list(query: ListMembersQueryDto, user: AuthUser) {
    const conditions: Prisma.MemberWhereInput[] = [this.scopeFor(user)];

    if (query.hasActiveSubscription !== undefined) {
      const active = { subscriptions: { some: { status: 'ACTIVE' as const } } };
      conditions.push(query.hasActiveSubscription ? active : { NOT: active });
    }

    if (query.q) {
      // Tìm tên không dấu bằng immutable_unaccent (index GIN trong migration init)
      const pattern = `%${escapeLike(query.q)}%`;
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT m.id FROM members m JOIN users u ON u.id = m.user_id
        WHERE immutable_unaccent(lower(u.full_name)) LIKE immutable_unaccent(lower(${pattern}))
           OR u.phone LIKE ${pattern}
           OR lower(m.member_code) LIKE lower(${pattern})`;
      conditions.push({ id: { in: rows.map((r) => r.id) } });
    }

    const where: Prisma.MemberWhereInput = { AND: conditions };
    const { page, pageSize } = query;
    const [total, members] = await this.prisma.$transaction([
      this.prisma.member.count({ where }),
      this.prisma.member.findMany({
        where,
        include: { user: true },
        orderBy: [{ user: { createdAt: 'desc' } }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const activeRows = await this.prisma.subscription.findMany({
      where: { memberId: { in: members.map((m) => m.id) }, status: 'ACTIVE' },
      select: { memberId: true },
      distinct: ['memberId'],
    });
    const activeIds = new Set(activeRows.map((r) => r.memberId));

    return {
      data: members.map((m) => toMemberResponse(m, activeIds.has(m.id))),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /** UC19, UC28. Kèm gói ACTIVE, FROZEN (số buổi tính sẵn) và lượt đang trong phòng. */
  async get(id: string, user: AuthUser): Promise<MemberDetailResponse> {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    // PT không phụ trách thì NOT_FOUND, không lộ hội viên có tồn tại (common/ownership)
    const member = await this.prisma.member.findFirst({
      where: { id, ...this.scopeFor(user) },
      select: { id: true },
    });
    assertFound(member);
    return this.loadDetail(member.id);
  }

  /** UC20. Tạo tài khoản MEMBER chưa có mật khẩu; kích hoạt sau qua quên mật khẩu hoặc tại quầy. */
  async create(dto: CreateMemberDto): Promise<MemberDetailResponse> {
    await this.assertContactFree(dto.phone, dto.email ?? null);

    let memberId: string;
    try {
      memberId = await this.prisma.$transaction(async (tx) => {
        // Khóa theo giao dịch để hai Staff tạo cùng lúc không sinh trùng mã HVxxxxxx
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('members.member_code'))`;
        const [{ max }] = await tx.$queryRaw<{ max: string | null }[]>`
          SELECT max(member_code) AS max FROM members WHERE member_code ~ '^HV[0-9]{6}$'`;
        const next = max ? Number(max.slice(2)) + 1 : 1;

        const created = await tx.user.create({
          data: {
            phone: dto.phone,
            fullName: dto.fullName,
            email: dto.email ?? null,
            dob: dto.dob ? fromDateOnly(dto.dob) : null,
            role: 'MEMBER',
          },
        });
        const member = await tx.member.create({
          data: {
            userId: created.id,
            memberCode: `HV${String(next).padStart(6, '0')}`,
            qrToken: randomBytes(16).toString('hex'),
          },
        });
        return member.id;
      });
    } catch (e) {
      await this.rethrowDuplicate(e, dto.phone, dto.email ?? null);
      throw e;
    }
    return this.loadDetail(memberId);
  }

  /** UC20. Chỉ đổi field được gửi; đổi SĐT thì SĐT mới là định danh đăng nhập. */
  async update(id: string, dto: UpdateMemberDto): Promise<MemberDetailResponse> {
    // DTO có sẵn mọi field (giá trị undefined), nên đếm field được gửi chứ không đếm key
    if (Object.values(dto).every((v) => v === undefined)) {
      throw new AppError('VALIDATION_ERROR', [{ field: 'body', messages: ['Cần ít nhất một field'] }]);
    }
    if (!isUUID(id)) throw new AppError('NOT_FOUND');

    const member = await this.prisma.member.findUnique({ where: { id }, include: { user: true } });
    assertFound(member);
    await this.assertContactFree(dto.phone ?? null, dto.email ?? null, member.userId);

    try {
      await this.prisma.user.update({
        where: { id: member.userId },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          email: dto.email,
          dob: dto.dob === undefined ? undefined : dto.dob === null ? null : fromDateOnly(dto.dob),
        },
      });
    } catch (e) {
      await this.rethrowDuplicate(e, dto.phone ?? null, dto.email ?? null, member.userId);
      throw e;
    }
    return this.loadDetail(id);
  }

  /** SĐT, email chưa có tài khoản khác dùng. PHONE_DUPLICATED kèm memberId để FE mở hồ sơ đó. */
  private async assertContactFree(phone: string | null, email: string | null, exceptUserId?: string) {
    if (phone) {
      const owner = await this.prisma.user.findUnique({ where: { phone }, include: { member: true } });
      if (owner && owner.id !== exceptUserId) {
        throw new AppError('PHONE_DUPLICATED', owner.member ? { memberId: owner.member.id } : null);
      }
    }
    if (email) {
      const owner = await this.prisma.user.findUnique({ where: { email } });
      if (owner && owner.id !== exceptUserId) throw new AppError('EMAIL_DUPLICATED');
    }
  }

  /**
   * Hai yêu cầu cùng lúc lọt qua bước kiểm tra thì unique của DB chặn (P2002).
   * Kiểm lại để ném đúng mã nghiệp vụ (kèm memberId như đường thường); không phải lỗi trùng thì để người gọi ném tiếp.
   */
  private async rethrowDuplicate(
    e: unknown,
    phone: string | null,
    email: string | null,
    exceptUserId?: string,
  ): Promise<void> {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return;
    await this.assertContactFree(phone, email, exceptUserId);
    const target = String(e.meta?.target ?? '');
    if (target.includes('phone')) throw new AppError('PHONE_DUPLICATED');
    if (target.includes('email')) throw new AppError('EMAIL_DUPLICATED');
  }

  private async loadDetail(id: string): Promise<MemberDetailResponse> {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { id },
      include: {
        user: true,
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'FROZEN'] } },
          orderBy: [{ endsOn: 'asc' }, { id: 'asc' }],
          include: { package: { select: { type: true } } },
        },
        checkIns: { where: { checkedOutAt: null }, take: 1 },
      },
    });

    const ptIds = member.subscriptions.filter((s) => s.totalSessions !== null).map((s) => s.id);
    const groups = ptIds.length
      ? await this.prisma.appointment.groupBy({
          by: ['subscriptionId', 'status'],
          where: { subscriptionId: { in: ptIds } },
          _count: { _all: true },
        })
      : [];
    const countsOf = (subscriptionId: string) =>
      Object.fromEntries(
        groups.filter((g) => g.subscriptionId === subscriptionId).map((g) => [g.status, g._count._all]),
      );

    const open = member.checkIns[0];
    return {
      ...toMemberResponse(
        member,
        member.subscriptions.some((s) => s.status === 'ACTIVE'),
      ),
      subscriptions: member.subscriptions.map((s) => toSubscriptionSummary(s, countsOf(s.id))),
      currentCheckIn: open ? { id: open.id, checkedInAt: toVnDateTime(open.checkedInAt) } : null,
    };
  }
}
