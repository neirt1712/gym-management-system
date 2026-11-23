import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

/**
 * Gói hội viên (4 endpoint). Xem: Triển; bảo lưu/mở lại: Hồng Anh (tuần 6, chưa làm).
 * UC: UC10, UC11 · Người làm: Triển, Hồng Anh. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
