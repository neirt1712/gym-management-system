import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * Thông báo.
 * UC: UC42–UC44 · Người làm: Hồng Anh. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 * Đã có: GET /notifications, PATCH /notifications/{id}/read. Còn: POST /notifications/broadcast (tuần 7).
 */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
