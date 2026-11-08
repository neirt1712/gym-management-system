import { Injectable } from '@nestjs/common';
import { Prisma, type Package } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AuditService } from '../../common/audit/audit.service';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { assertFound, assertOwnership } from '../../common/ownership/ownership';
import { addDays, computeEndsOn, todayVn, vnDayEnd, vnDayStart } from '../../common/time/vn-date';
import { PrismaService } from '../../prisma/prisma.service';
import { fromDateOnly, toDateOnly } from '../members/member.response';
import type { CancelOrderDto, ListOrdersQueryDto, OrderRequestDto } from './dto/order.dto';
import { ORDER_INCLUDE, toOrderResponse } from './order.response';

const fieldError = (field: string, message: string): AppError =>
  new AppError('VALIDATION_ERROR', [{ field, messages: [message] }], message);

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** UC09. Chỉ tính, không ghi gì vào DB. */
  async quote(dto: OrderRequestDto, user: AuthUser) {
    const { pkg, startsOn, endsOn, renewalOf } = await this.prepare(dto, user);
    return {
      packageId: pkg.id,
      packageName: pkg.name,
      type: pkg.type,
      price: pkg.price,
      total: pkg.price,
      durationValue: pkg.durationValue,
      durationUnit: pkg.durationUnit,
      totalSessions: pkg.totalSessions,
      sessionMinutes: pkg.sessionMinutes,
      includesClass: pkg.includesClass,
      startsOn,
      endsOn,
      renewalOf,
    };
  }

  /** UC09. Tạo đơn PENDING, chụp lại điều khoản gói. Trước khi chọn phương thức, hạn là hết ngày. */
  async create(dto: OrderRequestDto, user: AuthUser) {
    const { pkg, memberId, startsOn, renewalOf } = await this.prepare(dto, user);

    // Đơn đã quá hạn mà job chưa kịp đóng không được chặn đơn mới cùng gói
    await this.prisma.order.updateMany({
      where: { memberId, packageId: pkg.id, status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    try {
      const order = await this.prisma.order.create({
        data: {
          memberId,
          packageId: pkg.id,
          renewalOf,
          priceSnapshot: pkg.price,
          durationValueSnapshot: pkg.durationValue,
          durationUnitSnapshot: pkg.durationUnit,
          totalSessionsSnapshot: pkg.totalSessions,
          sessionMinutesSnapshot: pkg.sessionMinutes,
          includesClassSnapshot: pkg.includesClass,
          startsOn: fromDateOnly(startsOn),
          total: pkg.price,
          expiresAt: vnDayEnd(todayVn()),
          createdBy: user.id,
        },
        include: ORDER_INCLUDE,
      });
      return toOrderResponse(order);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const pending = await this.prisma.order.findFirst({
          where: { memberId, packageId: pkg.id, status: 'PENDING' },
          select: { id: true },
        });
        throw new AppError('PENDING_ORDER_EXISTS', { orderId: pending?.id ?? null });
      }
      throw e;
    }
  }

  /**
   * UC14. MEMBER chỉ thấy đơn của mình. STAFF xem đơn mọi ngày (Q24a, Triển tạm chốt Q17c):
   * quyết định 19 chỉ giới hạn giao dịch, quầy cần tra đơn chờ trả của hội viên.
   */
  async list(query: ListOrdersQueryDto, user: AuthUser) {
    const { from, to } = query;
    const where: Prisma.OrderWhereInput = {
      status: query.status,
      ...(user.role === 'MEMBER' ? { member: { userId: user.id } } : { memberId: query.memberId }),
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
    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      data: orders.map(toOrderResponse),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /** UC14, UC12. Nguồn duy nhất để FE biết đã thanh toán xong. */
  async get(id: string, user: AuthUser) {
    const order = await this.load(id);
    assertOwnership(user, { memberUserId: order.member.userId });
    if (await this.expireIfOverdue(id)) return toOrderResponse(await this.load(id));
    return toOrderResponse(order);
  }

  /** UC09. Hủy lặp trả đơn hiện tại; Staff/Admin hủy hộ phải có lý do và ghi audit. */
  async cancel(id: string, dto: CancelOrderDto, user: AuthUser) {
    const current = await this.load(id);
    assertOwnership(user, { memberUserId: current.member.userId });
    await this.expireIfOverdue(id);

    const onBehalf = user.role !== 'MEMBER';
    if (onBehalf && !dto.reason?.trim()) throw fieldError('reason', 'Cần nhập lý do khi hủy hộ');

    await this.prisma.$transaction(async (tx) => {
      // Khóa dòng đơn để không hủy trúng lúc đơn đang được xác nhận thanh toán
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${id}::uuid FOR UPDATE`;
      const order = await tx.order.findUniqueOrThrow({ where: { id } });
      if (order.status === 'CANCELLED') return;
      if (order.status !== 'PENDING') throw new AppError('ORDER_NOT_PENDING', { status: order.status });

      await tx.payment.updateMany({ where: { orderId: id, status: 'PENDING' }, data: { status: 'FAILED' } });
      await tx.order.update({ where: { id }, data: { status: 'CANCELLED' } });
      if (onBehalf) {
        await this.audit.log(tx, {
          actorId: user.id,
          action: 'ORDER_CANCEL',
          targetType: 'order',
          targetId: id,
          before: { status: order.status },
          after: { status: 'CANCELLED' },
          reason: dto.reason,
        });
      }
    });
    return toOrderResponse(await this.load(id));
  }

  private async load(id: string) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    assertFound(order);
    return order;
  }

  /**
   * Q24e: job "hết hạn đơn" (tuần 7) chưa có, nên đơn PENDING quá hạn chuyển EXPIRED ngay khi được đọc;
   * payment đang chờ chuyển FAILED như khi hủy đơn. Trả true nếu vừa đổi.
   */
  private async expireIfOverdue(id: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id, status: 'PENDING', expiresAt: { lt: new Date() } },
        data: { status: 'EXPIRED' },
      });
      if (count === 0) return false;
      await tx.payment.updateMany({ where: { orderId: id, status: 'PENDING' }, data: { status: 'FAILED' } });
      return true;
    });
  }

  /** Phần dùng chung của báo giá và tạo đơn: kiểm tra gói, hội viên, gia hạn, tính ngày. */
  private async prepare(dto: OrderRequestDto, user: AuthUser) {
    const memberId = await this.resolveMemberId(dto, user);

    const pkg: Package | null = await this.prisma.package.findUnique({ where: { id: dto.packageId } });
    assertFound(pkg);
    if (pkg.status !== 'ACTIVE') throw fieldError('packageId', 'Gói đã ngừng bán');

    let startsOn = dto.startsOn;
    let renewalOf: string | null = null;
    if (dto.renewalOf) {
      const source = await this.prisma.subscription.findUnique({ where: { id: dto.renewalOf } });
      if (!source || source.memberId !== memberId) throw new AppError('NOT_FOUND');
      if (source.status === 'CANCELLED') throw fieldError('renewalOf', 'Không gia hạn được gói đã hủy');
      renewalOf = source.id;
      // Q24d: gói cũ đã hết hạn thì gói mới mặc định bắt đầu hôm nay, không lùi về quá khứ
      const afterSource = addDays(toDateOnly(source.endsOn), 1);
      startsOn ??= afterSource > todayVn() ? afterSource : todayVn();
    }

    const today = todayVn();
    startsOn ??= today;
    if (startsOn < today) throw fieldError('startsOn', 'Ngày bắt đầu không được trước hôm nay');

    return {
      pkg,
      memberId,
      startsOn,
      renewalOf,
      endsOn: computeEndsOn(startsOn, pkg.durationValue, pkg.durationUnit),
    };
  }

  private async resolveMemberId(dto: OrderRequestDto, user: AuthUser): Promise<string> {
    if (user.role === 'MEMBER') {
      const own = await this.prisma.member.findUnique({ where: { userId: user.id }, select: { id: true } });
      assertFound(own);
      return own.id;
    }
    if (!dto.memberId) throw fieldError('memberId', 'Cần chọn hội viên khi mua hộ');
    const member = await this.prisma.member.findUnique({ where: { id: dto.memberId }, select: { id: true } });
    assertFound(member);
    return member.id;
  }
}
