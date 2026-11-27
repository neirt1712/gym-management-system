import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BUSINESS } from '../../config/business.config';
import { JobsService } from './jobs.service';

const { timezone } = BUSINESS;
const cron = BUSINESS.jobs;

/** Lịch chạy các việc nền (quyết định 17), giờ Việt Nam. Lỗi của một lần chạy chỉ ghi log, lần sau chạy lại. */
@Injectable()
export class JobsCron {
  private readonly logger = new Logger(JobsCron.name);

  constructor(private readonly jobs: JobsService) {}

  @Cron(cron.expireSubscriptionsCron, { name: 'expire-subscriptions', timeZone: timezone })
  expireSubscriptions() {
    return this.run('Gói hết hạn chuyển EXPIRED', () => this.jobs.expireSubscriptions());
  }

  @Cron(cron.expiringSubscriptionNoticeCron, { name: 'expiring-subscriptions', timeZone: timezone })
  notifyExpiring() {
    return this.run('Báo gói sắp hết hạn', () => this.jobs.notifyExpiringSubscriptions());
  }

  @Cron(cron.appointmentReminderCron, { name: 'appointment-reminder', timeZone: timezone })
  remindAppointments() {
    return this.run('Nhắc lịch PT trước 2 giờ', () => this.jobs.remindUpcomingAppointments());
  }

  @Cron(cron.trainerConfirmReminderCron, { name: 'trainer-confirm-reminder', timeZone: timezone })
  remindTrainerConfirm() {
    return this.run('Nhắc PT xác nhận buổi tập', () => this.jobs.remindTrainerConfirm());
  }

  @Cron(cron.expirePendingOrdersCron, { name: 'expire-pending-orders', timeZone: timezone })
  expireOrders() {
    return this.run('Đơn quá hạn chuyển EXPIRED', () => this.jobs.expirePendingOrders());
  }

  private async run(label: string, task: () => Promise<number>): Promise<void> {
    try {
      const count = await task();
      if (count > 0) this.logger.log(`${label}: ${count}`);
    } catch (e) {
      this.logger.error(`${label} lỗi`, e instanceof Error ? e.stack : String(e));
    }
  }
}
