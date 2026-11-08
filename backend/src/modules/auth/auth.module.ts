import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Xác thực (7 endpoint): đăng ký, đăng nhập, refresh, đăng xuất, quên/đặt lại/đổi mật khẩu.
 * UC: UC01–UC04, UC06 · Người làm: Triển. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 * Quên/đặt lại mật khẩu làm ở tuần 7 (Hồng Anh, kèm Nodemailer).
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
