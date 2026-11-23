import { Module } from '@nestjs/common';
import { SubscriptionFreezeService } from './subscription-freeze.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsJob } from './subscriptions.job';
import { SubscriptionsService } from './subscriptions.service';

/**
 * Gói hội viên (4 endpoint): xem gói, số buổi theo tháng; bảo lưu, mở lại (job tự mở khi hết kỳ, Q20b).
 * UC: UC10, UC11 · Người làm: Triển (gộp phần của Hồng Anh từ 23/11). Chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionFreezeService, SubscriptionsJob],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
