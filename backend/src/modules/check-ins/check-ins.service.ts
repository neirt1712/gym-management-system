import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { pageMeta } from '../../common/notify';
import { assertFound, assertOwnership } from '../../common/ownership/ownership';
import { todayVn, vnDayEnd, vnDayStart } from '../../common/time/vn-date';
import { PrismaService } from '../../prisma/prisma.service';
import { toDateOnly } from '../members/member.response';
import { CHECK_IN_INCLUDE, toCheckInResponse } from './check-in.response';
import type { CreateCheckInDto, ListCheckInsQueryDto } from './dto/check-in.dto';

@Injectable()
export class CheckInsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * UC16. Thứ tự kiểm: QR sai (INVALID_QR) / SĐT không khớp (NOT_FOUND) → còn lượt chưa check-out
   * (ALREADY_CHECKED_IN) → gói: chọn gói ACTIVE có hiệu lực hôm nay, hết hạn sớm nhất.
   * Gói chưa tới startsOn không tính; gói PT được vào phòng tập (Q17b). Không trừ buổi PT.
   */
  async create(dto: CreateCheckInDto, staff: AuthUser) {
    if (!!dto.qrToken === !!dto.phone) {
      const message = 'Gửi đúng một trong qrToken hoặc phone';
      throw new AppError('VALIDATION_ERROR', [{ field: 'qrToken', messages: [message] }], message);
    }
    const member = dto.qrToken
      ? await this.prisma.member.findUnique({ where: { qrToken: dto.qrToken } })
      : await this.prisma.member.findFirst({ where: { user: { phone: dto.phone } } });
    if (!member) throw new AppError(dto.qrToken ? 'INVALID_QR' : 'NOT_FOUND');

    const open = await this.prisma.checkIn.findFirst({ where: { memberId: member.id, checkedOutAt: null } });
    if (open) throw new AppError('ALREADY_CHECKED_IN', { checkInId: open.id });

    const today = todayVn();
    const subs = await this.prisma.subscription.findMany({
      where: { memberId: member.id, status: { in: ['ACTIVE', 'FROZEN', 'EXPIRED'] } },
      orderBy: { endsOn: 'asc' },
    });
    const usable = subs.find(
      (s) => s.status === 'ACTIVE' && toDateOnly(s.startsOn) <= today && toDateOnly(s.endsOn) >= today,
    );
    if (!usable) {
      if (subs.some((s) => s.status === 'FROZEN' && toDateOnly(s.endsOn) >= today)) {
        throw new AppError('SUBSCRIPTION_FROZEN');
      }
      const started = subs.filter((s) => toDateOnly(s.startsOn) <= today);
      const latest = started.at(-1);
      if (latest && toDateOnly(latest.endsOn) < today) throw new AppError('SUBSCRIPTION_EXPIRED');
      throw new AppError('NO_ACTIVE_SUBSCRIPTION');
    }

    try {
      const checkIn = await this.prisma.checkIn.create({
        data: {
          memberId: member.id,
          subscriptionId: usable.id,
          method: dto.qrToken ? 'QR' : 'PHONE',
          checkedInBy: staff.id,
        },
        include: CHECK_IN_INCLUDE,
      });
      return toCheckInResponse(checkIn);
    } catch (e) {
      // Hai lần quét cùng lúc: unique "một lượt chưa check-out mỗi hội viên" chặn lần sau
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const existing = await this.prisma.checkIn.findFirst({
          where: { memberId: member.id, checkedOutAt: null },
        });
        throw new AppError('ALREADY_CHECKED_IN', { checkInId: existing?.id ?? null });
      }
      throw e;
    }
  }

  /** UC17. Hội viên tự bấm: SELF; Staff, Admin làm hộ: STAFF. Gửi lặp trả lượt hiện tại. */
  async checkOut(id: string, user: AuthUser) {
    const current = await this.load(id);
    assertOwnership(user, { memberUserId: current.member.userId });
    if (current.checkedOutAt) return toCheckInResponse(current);

    await this.prisma.checkIn.updateMany({
      where: { id, checkedOutAt: null },
      data: { checkedOutAt: new Date(), checkoutType: user.role === 'MEMBER' ? 'SELF' : 'STAFF' },
    });
    return toCheckInResponse(await this.load(id));
  }

  /** UC18. `present=true` là người đang trong phòng. MEMBER chỉ thấy của mình. Mới nhất trước. */
  async list(query: ListCheckInsQueryDto, user: AuthUser) {
    const where: Prisma.CheckInWhereInput = {
      ...(user.role === 'MEMBER' ? { member: { userId: user.id } } : { memberId: query.memberId }),
      ...(query.present === true ? { checkedOutAt: null } : {}),
      ...(query.present === false ? { checkedOutAt: { not: null } } : {}),
      ...(query.from || query.to
        ? {
            checkedInAt: {
              ...(query.from ? { gte: vnDayStart(query.from) } : {}),
              ...(query.to ? { lte: vnDayEnd(query.to) } : {}),
            },
          }
        : {}),
    };
    const { page, pageSize } = query;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.checkIn.count({ where }),
      this.prisma.checkIn.findMany({
        where,
        include: CHECK_IN_INCLUDE,
        orderBy: [{ checkedInAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { data: rows.map(toCheckInResponse), meta: pageMeta(page, pageSize, total) };
  }

  /** Job 23:59 (quyết định 17): đóng mọi lượt còn mở, kiểu AUTO. Trả số lượt đã đóng. */
  async closeOpenCheckIns(now: Date = new Date()): Promise<number> {
    const { count } = await this.prisma.checkIn.updateMany({
      where: { checkedOutAt: null, checkedInAt: { lte: now } },
      data: { checkedOutAt: now, checkoutType: 'AUTO' },
    });
    return count;
  }

  private async load(id: string) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const checkIn = await this.prisma.checkIn.findUnique({ where: { id }, include: CHECK_IN_INCLUDE });
    assertFound(checkIn);
    return checkIn;
  }
}
