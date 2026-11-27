import { Module } from '@nestjs/common';
import { JobsCron } from './jobs.cron';
import { JobsService } from './jobs.service';

/**
 * Việc nền (quyết định 17): gói hết hạn, báo gói sắp hết hạn 08:00, nhắc lịch PT trước 2 giờ,
 * nhắc PT xác nhận buổi tập sau 24 giờ, hết hạn đơn PENDING mỗi 5 phút. Job 23:59 đóng check-in và tự mở lại
 * bảo lưu nằm ở module check-ins, subscriptions. Người làm: Triển (gộp phần của Hồng Anh từ 23/11).
 */
@Module({
  providers: [JobsService, JobsCron],
  exports: [JobsService],
})
export class JobsModule {}
