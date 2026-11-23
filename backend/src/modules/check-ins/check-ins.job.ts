import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BUSINESS } from '../../config/business.config';
import { CheckInsService } from './check-ins.service';

/** Quyết định 17: 23:59 giờ Việt Nam tự đóng các lượt check-in còn mở (checkoutType AUTO). */
@Injectable()
export class CheckInsJob {
  private readonly logger = new Logger(CheckInsJob.name);

  constructor(private readonly checkIns: CheckInsService) {}

  @Cron(BUSINESS.jobs.autoCheckoutCron, { name: 'auto-checkout', timeZone: BUSINESS.timezone })
  async autoCheckout(): Promise<void> {
    const count = await this.checkIns.closeOpenCheckIns();
    this.logger.log(`Tự đóng ${count} lượt check-in còn mở`);
  }
}
