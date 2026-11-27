import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';

/**
 * Theo dõi tập (5 endpoint): ghi chú, kế hoạch.
 * UC: UC29, UC30 · Người làm: Triển (gộp phần của Hồng Anh từ 23/11). Chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [TrainingController],
  providers: [TrainingService],
})
export class TrainingModule {}
