import { Injectable } from '@nestjs/common';
import { Prisma, type CheckIn, type Member, type Subscription, type User } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { assertFound } from '../../common/ownership/ownership';
import { BUSINESS } from '../../config/business.config';
import { PrismaService } from '../../prisma/prisma.service';
import { fromDateOnly, toDateOnly, toVnDateTime } from '../members/member.response';
import type { CreateCheckInDto, ListCheckInsQueryDto } from './dto/check-in.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Hôm nay theo giờ Việt Nam, dạng Date nửa đêm UTC để so với cột @db.Date. */
const vnToday = (): Date => fromDateOnly(toVnDateTime(new Date()).slice(0, 10));

/** Số ngày còn lại, tính cả hôm nay (openapi SubscriptionRef.daysLeft). */
const daysLeft = (endsOn: Date, today: Date): number =>
  Math.max(Math.round((endsOn.getTime() - today.getTime()) / DAY_MS) + 1, 0);

type CheckInRow = CheckIn & {
  member: Member & { user: User };
  subscription: Subscription;
  staff: User;
};

const INCLUDE = { member: { include: { user: true } }, subscription: true, staff: true } as const;

/** Schema `CheckIn` trong openapi. */
const toCheckInResponse = (c: CheckInRow, today: Date = vnToday()) => {
  const left = daysLeft(c.subscription.endsOn, today);
  return {
    id: c.id,
    member: {
      id: c.member.id,
      memberCode: c.member.memberCode,
      fullName: c.member.user.fullName,
      phone: c.member.user.phone,
      avatarUrl: c.member.user.avatarUrl,
    },
    subscription: {
      id: c.subscription.id,
      packageName: c.subscription.packageName,
      endsOn: toDateOnly(c.subscription.endsOn),
      daysLeft: left,
    },
    method: c.method,
    checkedInAt: toVnDateTime(c.checkedInAt),
    checkedOutAt: c.checkedOutAt ? toVnDateTime(c.checkedOutAt) : null,
    checkoutType: c.checkoutType,
    checkedInBy: { id: c.staff.id, fullName: c.staff.fullName },
    // UC16: còn 7 ngày trở xuống thì FE cảnh báo sắp hết hạn
    expiringSoon: left <= BUSINESS.jobs.expiringSubscriptionNoticeDays,
  };
};

@Injectable()
export class CheckInsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * UC16. Thứ tự kiểm tra theo openapi: tìm hội viên → lượt chưa check-out → gói.
   * Chọn gói ACTIVE có hiệu lực hôm nay, hết hạn sớm nhất. Gói PT ACTIVE cũng được vào phòng (Q17b).
   * Gói chưa tới startsOn không tính (Q17b → NO_ACTIVE_SUBSCRIPTION). Không trừ buổi PT.
   */
  async create(dto: CreateCheckInDto, staff: AuthUser) {
    if ((dto.qrToken === undefined) === (dto.phone === undefined)) {
      throw new AppError('VALIDATION_ERROR', [
        { field: 'body', messages: ['Gửi đúng một trong qrToken hoặc phone'] },
      ]);
    }

    const member = dto.qrToken
      ? await this.prisma.member.findUnique({ where: { qrToken: dto.qrToken } })
      : ((await this.prisma.user.findUnique({ where: { phone: dto.phone }, include: { member: true } }))
          ?.member ?? null);
    if (!member) throw new AppError(dto.qrToken ? 'INVALID_QR' : 'NOT_FOUND');

    const open = await this.prisma.checkIn.findFirst({
      where: { memberId: member.id, checkedOutAt: null },
      select: { id: true },
    });
    if (open) throw new AppError('ALREADY_CHECKED_IN', { checkInId: open.id });

    const today = vnToday();
    const subscription = await this.pickSubscription(member.id, today);

    try {
      const created = await this.prisma.checkIn.create({
        data: {
          memberId: member.id,
          subscriptionId: subscription.id,
          method: dto.qrToken ? 'QR' : 'PHONE',
          checkedInBy: staff.id,
        },
        include: INCLUDE,
      });
      return toCheckInResponse(created, today);
    } catch (e) {
      // Hai Staff check-in cùng lúc: unique "một lượt mở mỗi hội viên" trong DB chặn
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const again = await this.prisma.checkIn.findFirst({
          where: { memberId: member.id, checkedOutAt: null },
          select: { id: true },
        });
        throw new AppError('ALREADY_CHECKED_IN', again ? { checkInId: again.id } : null);
      }
      throw e;
    }
  }

  /**
   * UC17. MEMBER chỉ lượt của mình (của người khác: 404), checkoutType SELF; STAFF, ADMIN: STAFF.
   * Gửi lặp khi đã check-out: trả lượt hiện tại.
   */
  async checkout(id: string, user: AuthUser) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const where: Prisma.CheckInWhereInput =
      user.role === 'MEMBER' ? { id, member: { userId: user.id } } : { id };
    const existing = await this.prisma.checkIn.findFirst({ where, select: { id: true } });
    assertFound(existing);

    // Chỉ đóng lượt còn mở, để gửi lặp hoặc job 23:59 chạy cùng lúc không ghi đè giờ ra
    await this.prisma.checkIn.updateMany({
      where: { id: existing.id, checkedOutAt: null },
      data: { checkedOutAt: new Date(), checkoutType: user.role === 'MEMBER' ? 'SELF' : 'STAFF' },
    });
    const row = await this.prisma.checkIn.findUniqueOrThrow({ where: { id: existing.id }, include: INCLUDE });
    return toCheckInResponse(row);
  }

  /** UC18. MEMBER chỉ của mình; STAFF, ADMIN lọc memberId. present=true: người đang trong phòng. Mới nhất trước. */
  async list(query: ListCheckInsQueryDto, user: AuthUser) {
    const conditions: Prisma.CheckInWhereInput[] = [];
    if (user.role === 'MEMBER') {
      conditions.push({ member: { userId: user.id } });
    } else if (query.memberId) {
      conditions.push({ memberId: query.memberId });
    }
    if (query.present !== undefined) {
      conditions.push({ checkedOutAt: query.present ? null : { not: null } });
    }
    if (query.from) conditions.push({ checkedInAt: { gte: new Date(`${query.from}T00:00:00+07:00`) } });
    if (query.to) {
      const end = new Date(new Date(`${query.to}T00:00:00+07:00`).getTime() + DAY_MS);
      conditions.push({ checkedInAt: { lt: end } });
    }
    if (query.from && query.to && query.to < query.from) {
      throw new AppError('VALIDATION_ERROR', [{ field: 'to', messages: ['to phải từ from trở đi'] }]);
    }

    const where: Prisma.CheckInWhereInput = { AND: conditions };
    const { page, pageSize } = query;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.checkIn.count({ where }),
      this.prisma.checkIn.findMany({
        where,
        include: INCLUDE,
        orderBy: [{ checkedInAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const today = vnToday();
    return {
      data: rows.map((r) => toCheckInResponse(r, today)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /**
   * Quyết định 17: job 23:59 tự đóng mọi lượt còn mở, checkoutType AUTO. Trả số lượt đã đóng.
   * Gọi từ CheckInsJob; tách hàm để test gọi thẳng.
   */
  async closeOpenCheckIns(now: Date = new Date()): Promise<number> {
    const { count } = await this.prisma.checkIn.updateMany({
      where: { checkedOutAt: null },
      data: { checkedOutAt: now, checkoutType: 'AUTO' },
    });
    return count;
  }

  /**
   * Gói ACTIVE có hiệu lực hôm nay, hết hạn sớm nhất. Không có thì báo lý do:
   * đang bảo lưu → SUBSCRIPTION_FROZEN; từng có gói nay đã hết hạn → SUBSCRIPTION_EXPIRED;
   * còn lại (chưa mua, gói chưa tới ngày bắt đầu, đã hủy) → NO_ACTIVE_SUBSCRIPTION.
   */
  private async pickSubscription(memberId: string, today: Date): Promise<Subscription> {
    const usable = await this.prisma.subscription.findFirst({
      where: { memberId, status: 'ACTIVE', startsOn: { lte: today }, endsOn: { gte: today } },
      orderBy: [{ endsOn: 'asc' }, { id: 'asc' }],
    });
    if (usable) return usable;

    const frozen = await this.prisma.subscription.count({ where: { memberId, status: 'FROZEN' } });
    if (frozen > 0) throw new AppError('SUBSCRIPTION_FROZEN');

    // Gói ACTIVE quá endsOn mà job chưa chuyển EXPIRED vẫn tính là hết hạn
    const expired = await this.prisma.subscription.count({
      where: {
        memberId,
        OR: [{ status: 'EXPIRED' }, { status: 'ACTIVE', endsOn: { lt: today } }],
      },
    });
    if (expired > 0) throw new AppError('SUBSCRIPTION_EXPIRED');
    throw new AppError('NO_ACTIVE_SUBSCRIPTION');
  }
}
