import type { Member, Order, Package, Payment, Prisma, User } from '@prisma/client';
import { computeEndsOn } from '../../common/time/vn-date';
import { toDateOnly, toVnDateTime } from '../members/member.response';

/** openapi: MemberRef. */
export const toMemberRef = (member: Member & { user: User }) => ({
  id: member.id,
  memberCode: member.memberCode,
  fullName: member.user.fullName,
  phone: member.user.phone,
  avatarUrl: member.user.avatarUrl,
});

/** openapi: UserRef. */
export const toUserRef = (user: Pick<User, 'id' | 'fullName'>) => ({ id: user.id, fullName: user.fullName });

/** openapi: PackageRef. */
export const toPackageRef = (pkg: Pick<Package, 'id' | 'name' | 'type'>) => ({
  id: pkg.id,
  name: pkg.name,
  type: pkg.type,
});

/** Ngày kết thúc luôn tính từ điều khoản đã chụp, không đọc lại gói (Admin sửa gói không ảnh hưởng đơn cũ). */
export const orderEndsOn = (order: Order): string =>
  computeEndsOn(toDateOnly(order.startsOn), order.durationValueSnapshot, order.durationUnitSnapshot);

export const ORDER_INCLUDE = {
  member: { include: { user: true } },
  package: true,
  creator: true,
  subscription: { select: { id: true, packageName: true } },
  payments: { include: { confirmer: true }, orderBy: { createdAt: 'desc' } },
} satisfies Prisma.OrderInclude;

export type OrderEntity = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

const toPaymentSummary = (payment: Payment) => ({
  id: payment.id,
  method: payment.method,
  amount: payment.amount,
  status: payment.status,
  paidAt: payment.paidAt ? toVnDateTime(payment.paidAt) : null,
  createdAt: toVnDateTime(payment.createdAt),
});

const toReceipt = (order: OrderEntity) => {
  const paid = order.payments.find((p) => p.status === 'SUCCESS');
  if (order.status !== 'PAID' || !order.receiptNo || !order.paidAt || !paid) return null;
  return {
    receiptNo: order.receiptNo,
    paidAt: toVnDateTime(order.paidAt),
    memberName: order.member.user.fullName,
    memberCode: order.member.memberCode,
    memberPhone: order.member.user.phone,
    // Q24g: tên gói lúc thanh toán (lưu ở gói hội viên), Admin đổi tên gói sau đó không đổi biên lai
    packageName: order.subscription?.packageName ?? order.package.name,
    startsOn: toDateOnly(order.startsOn),
    endsOn: orderEndsOn(order),
    amount: paid.amount,
    method: paid.method,
    collectedBy: paid.confirmer ? toUserRef(paid.confirmer) : null,
  };
};

/** openapi: Order. */
export const toOrderResponse = (order: OrderEntity) => ({
  id: order.id,
  member: toMemberRef(order.member),
  package: toPackageRef(order.package),
  renewalOf: order.renewalOf,
  terms: {
    price: order.priceSnapshot,
    durationValue: order.durationValueSnapshot,
    durationUnit: order.durationUnitSnapshot,
    totalSessions: order.totalSessionsSnapshot,
    sessionMinutes: order.sessionMinutesSnapshot,
    includesClass: order.includesClassSnapshot,
  },
  startsOn: toDateOnly(order.startsOn),
  endsOn: orderEndsOn(order),
  total: order.total,
  status: order.status,
  expiresAt: toVnDateTime(order.expiresAt),
  paidAt: order.paidAt ? toVnDateTime(order.paidAt) : null,
  receiptNo: order.receiptNo,
  subscriptionId: order.subscription?.id ?? null,
  createdBy: toUserRef(order.creator),
  createdAt: toVnDateTime(order.createdAt),
  payments: order.payments.map(toPaymentSummary),
  receipt: toReceipt(order),
});
