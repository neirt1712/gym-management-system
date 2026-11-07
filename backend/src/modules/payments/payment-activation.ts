import { Prisma, type Order, type Payment } from '@prisma/client';
import { todayVn } from '../../common/time/vn-date';
import { toDateOnly, fromDateOnly } from '../members/member.response';
import { orderEndsOn } from '../orders/order.response';

type Confirmation = {
  paidAt: Date;
  confirmedBy?: string;
  gatewayTxnId?: string;
  gatewayPayload?: Prisma.InputJsonValue;
};

/** Biên lai dạng BL-YYYYMMDD-NNNN. Khóa theo giao dịch để hai thanh toán cùng lúc không trùng số. */
const nextReceiptNo = async (tx: Prisma.TransactionClient, paidAt: Date): Promise<string> => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('orders.receipt_no'))`;
  const prefix = `BL-${todayVn(paidAt).replace(/-/g, '')}-`;
  const last = await tx.order.findFirst({
    where: { receiptNo: { startsWith: prefix } },
    orderBy: { receiptNo: 'desc' },
    select: { receiptNo: true },
  });
  const next = last?.receiptNo ? Number(last.receiptNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
};

const toVnDisplayDate = (day: string): string => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/**
 * Gói hội viên chỉ sinh ra khi thanh toán SUCCESS (domain.md).
 * Payment SUCCESS, đơn PAID + số biên lai, subscription và thông báo nằm trong transaction của bên gọi.
 */
export const activateOrder = async (
  tx: Prisma.TransactionClient,
  order: Order,
  payment: Payment,
  confirmation: Confirmation,
): Promise<void> => {
  const { paidAt, confirmedBy, gatewayTxnId, gatewayPayload } = confirmation;

  await tx.payment.update({
    where: { id: payment.id },
    data: { status: 'SUCCESS', paidAt, confirmedBy, gatewayTxnId, gatewayPayload },
  });
  await tx.order.update({
    where: { id: order.id },
    data: { status: 'PAID', paidAt, receiptNo: await nextReceiptNo(tx, paidAt) },
  });

  const pkg = await tx.package.findUniqueOrThrow({ where: { id: order.packageId } });
  const startsOn = toDateOnly(order.startsOn);
  const endsOn = orderEndsOn(order);
  await tx.subscription.create({
    data: {
      memberId: order.memberId,
      packageId: order.packageId,
      orderId: order.id,
      packageName: pkg.name,
      totalSessions: order.totalSessionsSnapshot,
      sessionMinutes: order.sessionMinutesSnapshot,
      includesClass: order.includesClassSnapshot,
      startsOn: order.startsOn,
      endsOn: fromDateOnly(endsOn),
    },
  });

  const member = await tx.member.findUniqueOrThrow({ where: { id: order.memberId } });
  await tx.notification.create({
    data: {
      userId: member.userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Thanh toán thành công',
      body: `Gói ${pkg.name} đã được kích hoạt, hiệu lực từ ${toVnDisplayDate(startsOn)} đến ${toVnDisplayDate(endsOn)}.`,
      targetType: 'ORDER',
      targetId: order.id,
    },
  });
};
