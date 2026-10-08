import { Module } from '@nestjs/common';

/**
 * Xác thực (7 endpoint): đăng ký, đăng nhập, refresh, đăng xuất, quên/đặt lại/đổi mật khẩu.
 * UC: UC01–UC04, UC06 · Người làm: Triển. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 * Còn rỗng: thêm controller, service, dto/ khi làm endpoint (skill /be-endpoint).
 */
@Module({})
export class AuthModule {}
