import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { MeService } from './me.service';

/**
 * Hồ sơ (3 endpoint + tạo lại QR theo Q6): GET/PATCH /me, POST /me/qr-token/regenerate, POST /uploads/avatar.
 * UC: UC05, UC15 · Người làm: Triển. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 * POST /uploads/avatar chưa làm.
 */
@Module({
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
