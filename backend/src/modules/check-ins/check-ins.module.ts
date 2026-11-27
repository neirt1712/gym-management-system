import { Module } from '@nestjs/common';
import { CheckInsController } from './check-ins.controller';
import { CheckInsJob } from './check-ins.job';
import { CheckInsService } from './check-ins.service';

/**
 * Check-in (3 endpoint) + job 23:59 tự đóng lượt còn mở.
 * UC: UC16–UC18 · Người làm: Hồng Anh. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 * ScheduleModule.forRoot() đặt ở AppModule (28/11, khi có thêm job).
 */
@Module({
  controllers: [CheckInsController],
  providers: [CheckInsService, CheckInsJob],
})
export class CheckInsModule {}
