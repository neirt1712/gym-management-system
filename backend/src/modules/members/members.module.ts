import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

/**
 * Hội viên (4 endpoint).
 * UC: UC19, UC20, UC28 · Người làm: Hồng Anh. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
