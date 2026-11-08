import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { CheckInsService } from './check-ins.service';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Số mili giây từ `now` tới 23:59:00 giờ Việt Nam kế tiếp. */
export const msUntilNextVn2359 = (now: Date): number => {
  const vnNow = now.getTime() + VN_OFFSET_MS;
  const vnMidnight = Math.floor(vnNow / DAY_MS) * DAY_MS;
  let target = vnMidnight + (23 * 60 + 59) * 60 * 1000;
  if (target <= vnNow) target += DAY_MS;
  return target - vnNow;
};

/**
 * Job 23:59 tự đóng lượt check-in còn mở (quyết định 17, `BUSINESS.jobs.autoCheckoutCron`).
 * Dùng bộ hẹn giờ của Node vì backend chưa cài @nestjs/schedule (thêm thư viện cần hỏi BE Lead).
 * Không chạy khi test (NODE_ENV=test) để không giữ tiến trình Jest.
 */
@Injectable()
export class AutoCheckoutJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutoCheckoutJob.name);
  private timer: NodeJS.Timeout | undefined;

  constructor(private readonly checkIns: CheckInsService) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test') return;
    this.schedule();
  }

  onModuleDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  private schedule(): void {
    this.timer = setTimeout(() => void this.run(), msUntilNextVn2359(new Date()));
    this.timer.unref();
  }

  private async run(): Promise<void> {
    try {
      const closed = await this.checkIns.closeOpenCheckIns();
      this.logger.log(`Tự đóng ${closed} lượt check-in còn mở`);
    } catch (e) {
      this.logger.error('Lỗi job tự đóng check-in', e instanceof Error ? e.stack : String(e));
    } finally {
      this.schedule();
    }
  }
}
