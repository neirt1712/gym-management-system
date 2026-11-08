import { Module } from '@nestjs/common';
import { AutoCheckoutJob } from './auto-checkout.job';
import { CheckInsController } from './check-ins.controller';
import { CheckInsService } from './check-ins.service';

/**
 * Check-in (3 endpoint) + job 23:59 tự đóng lượt còn mở.
 * UC: UC16–UC18 · Người làm: Hồng Anh, chuyển Triển 08/11.
 * Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [CheckInsController],
  providers: [CheckInsService, AutoCheckoutJob],
})
export class CheckInsModule {}
