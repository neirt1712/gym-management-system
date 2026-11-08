import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * Thông báo: GET /notifications, PATCH /notifications/{id}/read. Broadcast làm ở tuần 7.
 * UC: UC42–UC44 · Người làm: Hồng Anh, chuyển Triển 08/11.
 * Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
