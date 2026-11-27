import { Module } from '@nestjs/common';
import { MemberPasswordService } from './member-password.service';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

/**
 * Hội viên (4 endpoint + đặt lại mật khẩu tại quầy theo Q15).
 * UC: UC04, UC19, UC20, UC28 · Người làm: Hồng Anh, Triển (gộp từ 23/11). Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [MembersController],
  providers: [MembersService, MemberPasswordService],
})
export class MembersModule {}
