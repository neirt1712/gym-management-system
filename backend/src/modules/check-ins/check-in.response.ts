import type { Prisma } from '@prisma/client';
import { daysLeft } from '../../common/time/vn-date';
import { toDateOnly, toVnDateTime } from '../members/member.response';
import { toMemberRef, toUserRef } from '../orders/order.response';

export const CHECK_IN_INCLUDE = {
  member: { include: { user: true } },
  subscription: { select: { id: true, packageName: true, endsOn: true } },
  staff: true,
} satisfies Prisma.CheckInInclude;

export type CheckInEntity = Prisma.CheckInGetPayload<{ include: typeof CHECK_IN_INCLUDE }>;

/** UC16: gói còn 7 ngày trở xuống thì FE cảnh báo "sắp hết hạn" (quyết định 17). */
const EXPIRING_DAYS = 7;

/** openapi CheckIn. */
export const toCheckInResponse = (c: CheckInEntity) => {
  const endsOn = toDateOnly(c.subscription.endsOn);
  const left = daysLeft(endsOn);
  return {
    id: c.id,
    member: toMemberRef(c.member),
    subscription: { id: c.subscription.id, packageName: c.subscription.packageName, endsOn, daysLeft: left },
    method: c.method,
    checkedInAt: toVnDateTime(c.checkedInAt),
    checkedOutAt: c.checkedOutAt ? toVnDateTime(c.checkedOutAt) : null,
    checkoutType: c.checkoutType,
    checkedInBy: toUserRef(c.staff),
    expiringSoon: left <= EXPIRING_DAYS,
  };
};
