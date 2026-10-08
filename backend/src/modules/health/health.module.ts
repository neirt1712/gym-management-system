import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/** Health check. Người làm: Triển dựng (tuần 1), Hồng Anh sở hữu từ tuần 2. */
@Module({ controllers: [HealthController] })
export class HealthModule {}
