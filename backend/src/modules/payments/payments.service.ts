import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type Order, type PaymentMethod } from '@prisma/client';
import { isUUID } from 'class-validator';
import { randomBytes } from 'crypto';
import { AuditService } from '../../common/audit/audit.service';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { assertFound, assertOwnership } from '../../common/ownership/ownership';
import { todayVn, vnDayEnd, vnDayStart } from '../../common/time/vn-date';
import { BUSINESS } from '../../config/business.config';
import { PrismaService } from '../../prisma/prisma.service';
import type { ConfirmCashDto, ListPaymentsQueryDto } from './dto/payment.dto';
import { activateOrder } from './payment-activation';
import { PAYMENT_INCLUDE, toPaymentResponse } from './payment.response';
import { buildCheckoutUrl, isValidSignature, toVnpayDate, type VnpayConfig } from './vnpay';

export type IpnResult = { RspCode: '00' | '01' | '02' | '04' | '97' | '99'; Message: string };

const IPN = {
  ok: { RspCode: '00', Message: 'Confirm Success' },
  notFound: { RspCode: '01', Message: 'Order not found' },
  duplicate: { RspCode: '02', Message: 'Order already confirmed' },
  badAmount: { RspCode: '04', Message: 'Invalid amount' },
  badSignature: { RspCode: '97', Message: 'Invalid signature' },
  failure: { RspCode: '99', Message: 'Unknown error' },
} satisfies Record<string, IpnResult>;

/** VNPay nhận IPv4; chạy local Express trả `::1` hoặc `::ffff:127.0.0.1`. */
const toIpv4 = (ip: string): string => (ip === '::1' ? '127.0.0.1' : ip.replace(/^::ffff:/, ''));

const newMerchantRef = (now: Date): string =>
  `GYM${toVnpayDate(now)}${randomBytes(2).toString('hex').toUpperCase()}`;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  /** UC12, UC13. Bấm thanh toán lại thì payment PENDING cũ chuyển FAILED; `amount` luôn bằng `total` của đơn. */
  async create(orderId: string, method: PaymentMethod, user: AuthUser, ipAddress: string) {
    if (!isUUID(orderId)) throw new AppError('NOT_FOUND');
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { member: { select: { userId: true } } },
    });
    assertFound(order);
    assertOwnership(user, { memberUserId: order.member.userId });

    const vnpay = method === 'VNPAY' ? this.vnpayConfig() : null;
    const now = new Date();
    const expiresAt =
      method === 'VNPAY'
        ? new Date(now.getTime() + BUSINESS.orders.vnpayPendingMinutes * 60_000)
        : vnDayEnd(todayVn(now));

    const payment = await this.prisma.$transaction(async (tx) => {
      const current = await this.lockOrder(tx, orderId);
      this.assertPayable(current, now);

      await tx.payment.updateMany({ where: { orderId, status: 'PENDING' }, data: { status: 'FAILED' } });
      await tx.order.update({ where: { id: orderId }, data: { expiresAt } });
      return tx.payment.create({
        data: { orderId, method, amount: current.total, merchantRef: newMerchantRef(now) },
        include: PAYMENT_INCLUDE,
      });
    });

    // VNPay đưa người dùng về trang đơn của FE (`/member/orders/:id`), trang này tự đọc GET /orders/{id}
    const checkoutUrl = vnpay
      ? buildCheckoutUrl(
          { ...vnpay, returnUrl: `${vnpay.returnUrl.replace(/\/+$/, '')}/${orderId}` },
          {
            merchantRef: payment.merchantRef,
            amount: payment.amount,
            ipAddress: toIpv4(ipAddress),
            createdAt: now,
            expiresAt,
            orderInfo: `Thanh toan don ${orderId}`,
          },
        )
      : null;
    return toPaymentResponse(payment, checkoutUrl);
  }

  /** UC14. MEMBER chỉ thấy của mình; STAFF chỉ thấy trong ngày (quyết định 19). */
  async list(query: ListPaymentsQueryDto, user: AuthUser) {
    const today = todayVn();
    const from = user.role === 'STAFF' ? today : query.from;
    const to = user.role === 'STAFF' ? today : query.to;

    const where: Prisma.PaymentWhereInput = {
      method: query.method,
      status: query.status,
      order:
        user.role === 'MEMBER'
          ? { member: { userId: user.id } }
          : query.memberId
            ? { memberId: query.memberId }
            : undefined,
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: vnDayStart(from) } : {}),
              ...(to ? { lte: vnDayEnd(to) } : {}),
            },
          }
        : {}),
    };

    const { page, pageSize } = query;
    const [total, payments] = await this.prisma.$transaction([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        include: PAYMENT_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      data: payments.map((p) => toPaymentResponse(p)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /** UC14. */
  async get(id: string, user: AuthUser) {
    const payment = await this.load(id);
    assertOwnership(user, { memberUserId: payment.order.member.userId });
    if (user.role === 'STAFF' && todayVn(payment.createdAt) !== todayVn()) throw new AppError('NOT_FOUND');
    return toPaymentResponse(payment);
  }

  /** UC13. Mọi thứ trong một transaction; gửi lặp trả kết quả cũ, không tạo gói lần hai. */
  async confirmCash(id: string, dto: ConfirmCashDto, user: AuthUser) {
    const payment = await this.load(id);
    if (payment.method !== 'CASH') {
      const message = 'Chỉ xác nhận được thanh toán tiền mặt';
      throw new AppError('VALIDATION_ERROR', [{ field: 'id', messages: [message] }], message);
    }
    if (payment.status === 'SUCCESS') return toPaymentResponse(payment);
    if (dto.receivedAmount !== payment.amount) {
      throw new AppError('CASH_AMOUNT_MISMATCH', { expectedAmount: payment.amount });
    }

    await this.prisma.$transaction(async (tx) => {
      const order = await this.lockOrder(tx, payment.orderId);
      const current = await tx.payment.findUniqueOrThrow({ where: { id } });
      if (current.status === 'SUCCESS') return;

      const now = new Date();
      this.assertPayable(order, now);
      if (current.status !== 'PENDING') {
        const message = 'Thanh toán này đã bị thay bằng lần khác';
        throw new AppError('VALIDATION_ERROR', [{ field: 'id', messages: [message] }], message);
      }

      await activateOrder(tx, order, current, { paidAt: now, confirmedBy: user.id });
      await this.audit.log(tx, {
        actorId: user.id,
        action: 'CASH_CONFIRM',
        targetType: 'payment',
        targetId: id,
        before: { status: current.status },
        after: { status: 'SUCCESS', receivedAmount: dto.receivedAmount },
      });
    });
    return toPaymentResponse(await this.load(id));
  }

  /** UC12. Theo thứ tự: chữ ký → tìm payment → số tiền → ghi nhận. Luôn trả định dạng VNPay, không ném lỗi. */
  async handleIpn(params: Record<string, string>): Promise<IpnResult> {
    try {
      const { hashSecret } = this.vnpayConfig();
      if (!isValidSignature(params, hashSecret)) return IPN.badSignature;

      const payment = await this.prisma.payment.findUnique({
        where: { merchantRef: params.vnp_TxnRef ?? '' },
      });
      if (!payment) return IPN.notFound;
      if (Number(params.vnp_Amount) !== payment.amount * 100) return IPN.badAmount;

      const succeeded = params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00';
      return await this.prisma.$transaction((tx) =>
        succeeded
          ? this.recordIpnSuccess(tx, payment.id, payment.orderId, params)
          : this.recordIpnFailure(tx, payment.id, payment.orderId, params),
      );
    } catch (e) {
      // Trùng gateway_txn_id: VNPay gọi lặp, giao dịch đã được xử lý
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return IPN.duplicate;
      this.logger.error('Lỗi xử lý IPN VNPay', e instanceof Error ? e.stack : String(e));
      return IPN.failure;
    }
  }

  /** Q17(d): link cũ báo thành công vẫn ghi nhận nếu đơn còn PENDING; ngược lại chỉ lưu payload. */
  private async recordIpnSuccess(
    tx: Prisma.TransactionClient,
    paymentId: string,
    orderId: string,
    params: Record<string, string>,
  ): Promise<IpnResult> {
    const order = await this.lockOrder(tx, orderId);
    const current = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (current.status === 'SUCCESS') return IPN.duplicate;

    if (order.status !== 'PENDING') {
      await tx.payment.update({ where: { id: paymentId }, data: { gatewayPayload: params } });
      return IPN.duplicate;
    }

    await tx.payment.updateMany({
      where: { orderId, status: 'PENDING', id: { not: paymentId } },
      data: { status: 'FAILED' },
    });
    await activateOrder(tx, order, current, {
      paidAt: new Date(),
      gatewayTxnId: params.vnp_TransactionNo,
      gatewayPayload: params,
    });
    return IPN.ok;
  }

  /** Thất bại hoặc người dùng hủy: payment FAILED, đơn vẫn PENDING để trả lại. */
  private async recordIpnFailure(
    tx: Prisma.TransactionClient,
    paymentId: string,
    orderId: string,
    params: Record<string, string>,
  ): Promise<IpnResult> {
    const order = await this.lockOrder(tx, orderId);
    const current = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (current.status !== 'PENDING') return IPN.duplicate;

    await tx.payment.update({ where: { id: paymentId }, data: { status: 'FAILED', gatewayPayload: params } });
    const member = await tx.member.findUniqueOrThrow({ where: { id: order.memberId } });
    await tx.notification.create({
      data: {
        userId: member.userId,
        type: 'PAYMENT_FAILED',
        title: 'Thanh toán không thành công',
        body: 'Thanh toán VNPay chưa thành công. Bạn có thể thanh toán lại trong đơn hàng.',
        targetType: 'ORDER',
        targetId: orderId,
      },
    });
    return IPN.ok;
  }

  /** Khóa dòng đơn để hai thanh toán cùng lúc không kích hoạt gói hai lần. */
  private async lockOrder(tx: Prisma.TransactionClient, orderId: string): Promise<Order> {
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId}::uuid FOR UPDATE`;
    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  }

  /** Đơn quá hạn mà job chưa kịp đóng cũng coi như EXPIRED. */
  private assertPayable(order: Order, now: Date): void {
    if (order.status !== 'PENDING') throw new AppError('ORDER_NOT_PENDING', { status: order.status });
    if (order.expiresAt < now) throw new AppError('ORDER_NOT_PENDING', { status: 'EXPIRED' });
  }

  private async load(id: string) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const payment = await this.prisma.payment.findUnique({ where: { id }, include: PAYMENT_INCLUDE });
    assertFound(payment);
    return payment;
  }

  private vnpayConfig(): VnpayConfig {
    const tmnCode = this.config.get<string>('VNPAY_TMN_CODE');
    const hashSecret = this.config.get<string>('VNPAY_HASH_SECRET');
    const url = this.config.get<string>('VNPAY_URL');
    const returnUrl = this.config.get<string>('VNPAY_RETURN_URL');
    if (!tmnCode || !hashSecret || !url || !returnUrl) {
      throw new AppError('INTERNAL_ERROR', null, 'Chưa cấu hình VNPay trong .env');
    }
    return { tmnCode, hashSecret, url, returnUrl };
  }
}
