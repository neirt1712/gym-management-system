import type { Prisma } from '@prisma/client';
import { toVnDateTime } from '../members/member.response';
import { toMemberRef, toUserRef } from '../orders/order.response';

export const PAYMENT_INCLUDE = {
  order: { include: { member: { include: { user: true } } } },
  confirmer: true,
} satisfies Prisma.PaymentInclude;

export type PaymentEntity = Prisma.PaymentGetPayload<{ include: typeof PAYMENT_INCLUDE }>;

/** openapi: Payment. `checkoutUrl` chỉ có ở response tạo payment VNPAY. */
export const toPaymentResponse = (payment: PaymentEntity, checkoutUrl: string | null = null) => ({
  id: payment.id,
  orderId: payment.orderId,
  member: toMemberRef(payment.order.member),
  method: payment.method,
  amount: payment.amount,
  status: payment.status,
  merchantRef: payment.merchantRef,
  gatewayTxnId: payment.gatewayTxnId,
  checkoutUrl,
  confirmedBy: payment.confirmer ? toUserRef(payment.confirmer) : null,
  paidAt: payment.paidAt ? toVnDateTime(payment.paidAt) : null,
  createdAt: toVnDateTime(payment.createdAt),
});
