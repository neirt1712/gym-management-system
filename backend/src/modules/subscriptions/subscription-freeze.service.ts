import { Injectable } from '@nestjs/common';
import type { Prisma, Subscription } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AuditService } from '../../common/audit/audit.service';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { notify } from '../../common/notify';
import { assertFound } from '../../common/ownership/ownership';
import { addDays, daysLeft, todayVn } from '../../common/time/vn-date';
import { PrismaService } from '../../prisma/prisma.service';
import { toDateOnly } from '../members/member.response';
import type { FreezeSubscriptionDto } from './dto/freeze-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

type Tx = Prisma.TransactionClient;

const toVnDisplay = (day: string) => day.split('-').reverse().join('/');

/**
 * UC11 bảo lưu và mở lại gói (quyết định 10): 1 lần mỗi gói, tối đa 30 ngày, chặn khi còn lịch PT sắp tới.
 * Mở lại cộng số ngày bảo lưu **thực tế** vào `endsOn` (Q20b); hết kỳ thì job tự mở lại.
 */
@Injectable()
export class SubscriptionFreezeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async freeze(id: string, dto: FreezeSubscriptionDto, user: AuthUser) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const today = todayVn();

    await this.prisma.$transaction(async (tx) => {
      const sub = await this.lock(tx, id);
      // Gói chưa tới ngày bắt đầu hoặc đã qua ngày kết thúc (job hết hạn chưa chạy) cũng coi như không ACTIVE
      const inPeriod = toDateOnly(sub.startsOn) <= today && today <= toDateOnly(sub.endsOn);
      if (sub.status !== 'ACTIVE' || !inPeriod) {
        throw new AppError('SUBSCRIPTION_NOT_ACTIVE', { status: sub.status });
      }
      if (sub.frozenFrom) throw new AppError('FREEZE_LIMIT_REACHED');

      const upcoming = await tx.appointment.findMany({
        where: { subscriptionId: id, status: { in: ['PENDING', 'CONFIRMED'] }, startsAt: { gt: new Date() } },
        select: { id: true },
        orderBy: { startsAt: 'asc' },
      });
      if (upcoming.length > 0) {
        throw new AppError('FREEZE_BLOCKED_BY_APPOINTMENTS', { appointmentIds: upcoming.map((a) => a.id) });
      }

      await tx.subscription.update({
        where: { id },
        data: {
          status: 'FROZEN',
          frozenFrom: new Date(today),
          frozenDays: dto.days,
          freezeReason: dto.reason,
        },
      });
      await this.notifyMember(tx, sub, {
        type: 'SUBSCRIPTION_FROZEN',
        title: 'Gói đã được bảo lưu',
        body: `Gói "${sub.packageName}" bảo lưu ${dto.days} ngày từ ${toVnDisplay(today)} đến ${toVnDisplay(addDays(today, dto.days - 1))}.`,
      });
      await this.audit.log(tx, {
        actorId: user.id,
        action: 'SUBSCRIPTION_FREEZE',
        targetType: 'subscription',
        targetId: id,
        before: { status: sub.status },
        after: { status: 'FROZEN', frozenFrom: today, frozenDays: dto.days },
        reason: dto.reason,
      });
    });
    return this.subscriptions.get(id, user);
  }

  async unfreeze(id: string, user: AuthUser) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    await this.prisma.$transaction(async (tx) => {
      const sub = await this.lock(tx, id);
      if (sub.status !== 'FROZEN') throw new AppError('SUBSCRIPTION_NOT_FROZEN', { status: sub.status });
      await this.reopen(tx, sub, todayVn(), user.id);
    });
    return this.subscriptions.get(id, user);
  }

  /** Job: gói FROZEN đã qua ngày cuối của kỳ bảo lưu thì tự mở lại, cộng đủ số ngày đã đăng ký (Q20b). */
  async reopenExpiredFreezes(today: string = todayVn()): Promise<number> {
    const frozen = await this.prisma.subscription.findMany({
      where: { status: 'FROZEN' },
      select: { id: true, frozenFrom: true, frozenDays: true },
    });
    const due = frozen.filter(
      (s) => s.frozenFrom && s.frozenDays && addDays(toDateOnly(s.frozenFrom), s.frozenDays - 1) < today,
    );
    for (const { id } of due) {
      await this.prisma.$transaction(async (tx) => {
        const sub = await this.lock(tx, id);
        if (sub.status === 'FROZEN') await this.reopen(tx, sub, today, null);
      });
    }
    return due.length;
  }

  /**
   * Số ngày thực tế = từ ngày bắt đầu bảo lưu tới hôm nay, tính cả hai đầu, không quá số ngày đã đăng ký.
   * Mở lại ngay trong ngày bắt đầu vẫn tính 1 ngày (cột frozen_days chỉ nhận 1–30). Lưu lại số ngày thực tế.
   */
  private async reopen(tx: Tx, sub: Subscription, today: string, actorId: string | null): Promise<void> {
    const frozenFrom = toDateOnly(sub.frozenFrom ?? new Date(today));
    const registered = sub.frozenDays ?? 1;
    const actual = Math.min(Math.max(daysLeft(today, frozenFrom), 1), registered);
    const endsOn = addDays(toDateOnly(sub.endsOn), actual);

    await tx.subscription.update({
      where: { id: sub.id },
      data: { status: 'ACTIVE', frozenDays: actual, endsOn: new Date(endsOn) },
    });
    await this.notifyMember(tx, sub, {
      type: 'SUBSCRIPTION_UNFROZEN',
      title: 'Gói đã mở lại',
      body: `Gói "${sub.packageName}" đã mở lại sau ${actual} ngày bảo lưu, hạn mới đến ${toVnDisplay(endsOn)}.`,
    });
    if (actorId) {
      await this.audit.log(tx, {
        actorId,
        action: 'SUBSCRIPTION_UNFREEZE',
        targetType: 'subscription',
        targetId: sub.id,
        before: { status: 'FROZEN', endsOn: toDateOnly(sub.endsOn) },
        after: { status: 'ACTIVE', endsOn, frozenDays: actual },
      });
    }
  }

  private async lock(tx: Tx, id: string): Promise<Subscription> {
    await tx.$queryRaw`SELECT id FROM subscriptions WHERE id = ${id}::uuid FOR UPDATE`;
    const sub = await tx.subscription.findUnique({ where: { id } });
    assertFound(sub);
    return sub;
  }

  private async notifyMember(tx: Tx, sub: Subscription, msg: { type: string; title: string; body: string }) {
    const member = await tx.member.findUniqueOrThrow({
      where: { id: sub.memberId },
      select: { userId: true },
    });
    await notify(tx, { userId: member.userId, ...msg, targetType: 'SUBSCRIPTION', targetId: sub.id });
  }
}
