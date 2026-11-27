import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BUSINESS } from '../../config/business.config';
import { SubscriptionFreezeService } from './subscription-freeze.service';

/** Q20b: hết kỳ bảo lưu thì gói tự mở lại, không chờ Staff. Chạy đầu ngày giờ Việt Nam. */
@Injectable()
export class SubscriptionsJob {
  private readonly logger = new Logger(SubscriptionsJob.name);

  constructor(private readonly freeze: SubscriptionFreezeService) {}

  @Cron(BUSINESS.jobs.autoUnfreezeCron, { name: 'auto-unfreeze', timeZone: BUSINESS.timezone })
  async autoUnfreeze(): Promise<void> {
    const count = await this.freeze.reopenExpiredFreezes();
    this.logger.log(`Tự mở lại ${count} gói hết kỳ bảo lưu`);
  }
}
