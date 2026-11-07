import { Injectable } from '@nestjs/common';
import type { AppointmentStatus, Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { assertFound, assertOwnership } from '../../common/ownership/ownership';
import { PrismaService } from '../../prisma/prisma.service';
import { toDateOnly } from '../members/member.response';
import type { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { SUBSCRIPTION_INCLUDE, toMonthlySessions, toSubscriptionResponse } from './subscription.response';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** UC10. MEMBER luôn chỉ thấy gói của mình. Số buổi tính từ lịch, không lưu cột. */
  async list(query: ListSubscriptionsQueryDto, user: AuthUser) {
    const where: Prisma.SubscriptionWhereInput = {
      status: query.status ? { in: query.status } : undefined,
      package: query.type ? { type: query.type } : undefined,
      ...(user.role === 'MEMBER' ? { member: { userId: user.id } } : { memberId: query.memberId }),
    };

    const { page, pageSize } = query;
    const [total, subscriptions] = await this.prisma.$transaction([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        include: SUBSCRIPTION_INCLUDE,
        orderBy: [{ endsOn: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const counts = await this.prisma.appointment.groupBy({
      by: ['subscriptionId', 'status'],
      where: { subscriptionId: { in: subscriptions.map((s) => s.id) } },
      _count: { _all: true },
    });
    const countsBySubscription = new Map<string, Partial<Record<AppointmentStatus, number>>>();
    for (const row of counts) {
      const entry = countsBySubscription.get(row.subscriptionId) ?? {};
      entry[row.status] = row._count._all;
      countsBySubscription.set(row.subscriptionId, entry);
    }

    return {
      data: subscriptions.map((s) => toSubscriptionResponse(s, countsBySubscription.get(s.id) ?? {})),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /** UC10. Kèm số buổi theo tháng; gói GYM là mảng rỗng. */
  async get(id: string, user: AuthUser) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const sub = await this.prisma.subscription.findUnique({ where: { id }, include: SUBSCRIPTION_INCLUDE });
    assertFound(sub);
    assertOwnership(user, { memberUserId: sub.member.userId });

    const appointments = await this.prisma.appointment.findMany({
      where: { subscriptionId: id },
      select: { status: true, startsAt: true },
    });
    const countByStatus: Partial<Record<AppointmentStatus, number>> = {};
    for (const { status } of appointments) countByStatus[status] = (countByStatus[status] ?? 0) + 1;

    return {
      ...toSubscriptionResponse(sub, countByStatus),
      monthlySessions:
        sub.totalSessions === null
          ? []
          : toMonthlySessions(toDateOnly(sub.startsOn), toDateOnly(sub.endsOn), appointments),
    };
  }
}
