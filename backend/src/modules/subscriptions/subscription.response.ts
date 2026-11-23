import type { AppointmentStatus, Prisma } from '@prisma/client';
import { addDays, daysLeft } from '../../common/time/vn-date';
import { toDateOnly, toSessionCounts } from '../members/member.response';
import { toMemberRef, toPackageRef } from '../orders/order.response';

export const SUBSCRIPTION_INCLUDE = {
  member: { include: { user: true } },
  package: true,
} satisfies Prisma.SubscriptionInclude;

export type SubscriptionEntity = Prisma.SubscriptionGetPayload<{ include: typeof SUBSCRIPTION_INCLUDE }>;

const toFreezeInfo = (sub: SubscriptionEntity) => {
  if (!sub.frozenFrom || !sub.frozenDays) return null;
  const frozenFrom = toDateOnly(sub.frozenFrom);
  return {
    frozenFrom,
    frozenDays: sub.frozenDays,
    frozenUntil: addDays(frozenFrom, sub.frozenDays - 1),
    reason: sub.freezeReason ?? '',
  };
};

/** openapi: Subscription. */
export const toSubscriptionResponse = (
  sub: SubscriptionEntity,
  countByStatus: Partial<Record<AppointmentStatus, number>>,
) => {
  const endsOn = toDateOnly(sub.endsOn);
  return {
    id: sub.id,
    member: toMemberRef(sub.member),
    package: toPackageRef(sub.package),
    orderId: sub.orderId,
    packageName: sub.packageName,
    type: sub.package.type,
    startsOn: toDateOnly(sub.startsOn),
    endsOn,
    daysLeft: daysLeft(endsOn),
    status: sub.status,
    includesClass: sub.includesClass,
    sessionMinutes: sub.sessionMinutes,
    sessions: sub.totalSessions === null ? null : toSessionCounts(sub.totalSessions, countByStatus),
    freeze: toFreezeInfo(sub),
  };
};

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** openapi: MonthlySessions. Đủ các tháng từ ngày bắt đầu đến ngày kết thúc, kể cả tháng không có buổi nào. */
export const toMonthlySessions = (
  startsOn: string,
  endsOn: string,
  appointments: { status: AppointmentStatus; startsAt: Date }[],
) => {
  const months = new Map<string, { month: string; completed: number; noShow: number; upcoming: number }>();
  const last = endsOn.slice(0, 7);
  for (let [year, month] = startsOn.split('-').map(Number); ; month += 1) {
    if (month > 12) {
      year += 1;
      month = 1;
    }
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (key > last) break;
    months.set(key, { month: key, completed: 0, noShow: 0, upcoming: 0 });
  }

  for (const { status, startsAt } of appointments) {
    const row = months.get(new Date(startsAt.getTime() + VN_OFFSET_MS).toISOString().slice(0, 7));
    if (!row) continue;
    if (status === 'COMPLETED') row.completed += 1;
    else if (status === 'NO_SHOW') row.noShow += 1;
    else if (status === 'PENDING' || status === 'CONFIRMED') row.upcoming += 1;
  }
  return [...months.values()];
};
