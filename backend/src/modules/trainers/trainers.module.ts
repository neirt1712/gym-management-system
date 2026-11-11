import { Module } from '@nestjs/common';
import { TrainersController } from './trainers.controller';
import { TrainersService } from './trainers.service';

/**
 * PT (6 endpoint): hồ sơ, khung giờ rảnh, hội viên phụ trách.
 * UC: UC21, UC22, UC28, UC33 · Người làm: Hồng Anh. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [TrainersController],
  providers: [TrainersService],
})
export class TrainersModule {}
