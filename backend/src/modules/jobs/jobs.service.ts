import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { addDays, todayVn } from '../../common/time/vn-date';
import { BUSINESS } from '../../config/business.config';
import { PrismaService } from '../../prisma/prisma.service';

const { expiringSubscriptionNoticeDays, appointmentReminderHoursBefore, trainerConfirmReminderHours } =
  BUSINESS.jobs;
const HOUR_MS = 3600_000;
const VN_OFFSET_MS = 7 * HOUR_MS;

/** "18:00 28/11" theo giờ Việt Nam. */
const vnTime = (d: Date) => {
  const v = new Date(d.getTime() + VN_OFFSET_MS).toISOString();
  return `${v.slice(11, 16)} ${v.slice(8, 10)}/${v.slice(5, 7)}`;
};
const toVnDisplay = (day: string) => day.split('-').reverse().join('/');

/**
 * Việc nền theo quyết định 17 (mốc ở BUSINESS.jobs). Mỗi hàm nhận "bây giờ" để test được, trả số dòng đã xử lý.
 * Thông báo tự động có `dedupKey` duy nhất nên job chạy lại không gửi lặp.
 */
@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Gói ACTIVE đã qua ngày kết thúc thì chuyển EXPIRED (đầu ngày giờ VN). */
  async expireSubscriptions(today: string = todayVn()): Promise<number> {
    const { count } = await this.prisma.subscription.updateMany({
      where: { status: 'ACTIVE', endsOn: { lt: new Date(today) } },
      data: { status: 'EXPIRED' },
    });
    return count;
  }

  /** 08:00: báo hội viên gói hết hạn trong 7 ngày tới (tính cả hôm nay), mỗi gói một lần. */
  async notifyExpiringSubscriptions(today: string = todayVn()): Promise<number> {
    const subs = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endsOn: { gte: new Date(today), lte: new Date(addDays(today, expiringSubscriptionNoticeDays - 1)) },
      },
      include: { member: { select: { userId: true } } },
    });
    return this.createOnce(
      subs.map((s) => {
        const endsOn = s.endsOn.toISOString().slice(0, 10);
        return {
          userId: s.member.userId,
          type: 'SUBSCRIPTION_EXPIRING',
          title: 'Gói sắp hết hạn',
          body: `Gói "${s.packageName}" hết hạn ngày ${toVnDisplay(endsOn)}. Gia hạn để tiếp tục tập.`,
          targetType: 'SUBSCRIPTION',
          targetId: s.id,
          dedupKey: `SUBSCRIPTION_EXPIRING:${s.id}:${endsOn}`,
        };
      }),
    );
  }

  /** Nhắc cả hội viên và PT trước buổi tập đã chốt 2 giờ. */
  async remindUpcomingAppointments(now: Date = new Date()): Promise<number> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        startsAt: { gt: now, lte: new Date(now.getTime() + appointmentReminderHoursBefore * HOUR_MS) },
      },
      include: { member: { include: { user: true } }, trainer: { include: { user: true } } },
    });
    return this.createOnce(
      appointments.flatMap((a) => {
        const when = vnTime(a.startsAt);
        const base = {
          type: 'APPOINTMENT_REMINDER',
          title: 'Sắp tới buổi tập',
          targetType: 'APPOINTMENT',
          targetId: a.id,
        };
        return [
          {
            ...base,
            userId: a.member.userId,
            body: `Bạn có buổi tập với PT ${a.trainer.user.fullName} lúc ${when}.`,
            dedupKey: `APPOINTMENT_REMINDER:${a.id}:${a.member.userId}:${a.startsAt.toISOString()}`,
          },
          {
            ...base,
            userId: a.trainer.userId,
            body: `Bạn có buổi tập với hội viên ${a.member.user.fullName} lúc ${when}.`,
            dedupKey: `APPOINTMENT_REMINDER:${a.id}:${a.trainer.userId}:${a.startsAt.toISOString()}`,
          },
        ];
      }),
    );
  }

  /**
   * Nhắc PT xác nhận buổi tập (COMPLETED hoặc NO_SHOW) khi buổi đã kết thúc quá 24 giờ mà vẫn CONFIRMED.
   * Triển chọn cách hiểu "nhắc PT xác nhận sau 24 giờ" (quyết định 17) là xác nhận buổi tập, ngày 28/11.
   */
  async remindTrainerConfirm(now: Date = new Date()): Promise<number> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        endsAt: { lte: new Date(now.getTime() - trainerConfirmReminderHours * HOUR_MS) },
      },
      include: { member: { include: { user: true } }, trainer: { select: { userId: true } } },
    });
    return this.createOnce(
      appointments.map((a) => ({
        userId: a.trainer.userId,
        type: 'APPOINTMENT_CONFIRM_REMINDER',
        title: 'Chưa xác nhận buổi tập',
        body: `Buổi tập với ${a.member.user.fullName} lúc ${vnTime(a.startsAt)} chưa được xác nhận đã tập hay vắng.`,
        targetType: 'APPOINTMENT',
        targetId: a.id,
        dedupKey: `APPOINTMENT_CONFIRM_REMINDER:${a.id}`,
      })),
    );
  }

  /** Mỗi 5 phút: đơn PENDING quá hạn chuyển EXPIRED, thanh toán đang chờ chuyển FAILED (giống Q24e). */
  async expirePendingOrders(now: Date = new Date()): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const overdue = await tx.order.findMany({
        where: { status: 'PENDING', expiresAt: { lt: now } },
        select: { id: true },
      });
      if (overdue.length === 0) return 0;
      const ids = overdue.map((o) => o.id);
      // Lặp lại điều kiện trong UPDATE: đơn vừa được trả tiền giữa hai câu lệnh không bị đổi
      const { count } = await tx.order.updateMany({
        where: { id: { in: ids }, status: 'PENDING', expiresAt: { lt: now } },
        data: { status: 'EXPIRED' },
      });
      await tx.payment.updateMany({
        where: { orderId: { in: ids }, status: 'PENDING', order: { status: 'EXPIRED' } },
        data: { status: 'FAILED' },
      });
      return count;
    });
  }

  private async createOnce(data: Prisma.NotificationCreateManyInput[]): Promise<number> {
    if (data.length === 0) return 0;
    const { count } = await this.prisma.notification.createMany({ data, skipDuplicates: true });
    return count;
  }
}
