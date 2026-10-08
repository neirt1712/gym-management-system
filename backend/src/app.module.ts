import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthCoreModule } from './common/auth/auth-core.module';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { FEATURE_MODULES } from './modules';

/**
 * Mục lục của backend.
 * Guard chạy theo thứ tự khai báo: JwtAuthGuard (đã đăng nhập chưa) rồi RolesGuard (đúng vai trò chưa).
 * Mọi endpoint mặc định cần đăng nhập; endpoint công khai gắn @Public().
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthCoreModule, ...FEATURE_MODULES],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
