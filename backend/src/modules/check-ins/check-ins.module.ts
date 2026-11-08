import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CheckInsController } from './check-ins.controller';
import { CheckInsJob } from './check-ins.job';
import { CheckInsService } from './check-ins.service';

/**
 * Check-in (3 endpoint) + job 23:59 tự đóng lượt còn mở.
 * UC: UC16–UC18 · Người làm: Hồng Anh. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 * TODO(Triển): ScheduleModule.forRoot() nên chuyển lên AppModule khi có job thứ hai (ADR 0001: @nestjs/schedule);
 * chỉ được gọi forRoot một lần.
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [CheckInsController],
  providers: [CheckInsService, CheckInsJob],
})
export class CheckInsModule {}
