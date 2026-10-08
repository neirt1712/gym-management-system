import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

const DEV_FALLBACK_SECRET = 'dev-only-secret-change-me';

/** JWT_SECRET bắt buộc ở staging/production. Máy dev chưa có .env thì dùng khóa tạm và cảnh báo. */
const resolveJwtSecret = (config: ConfigService): string => {
  const secret = config.get<string>('JWT_SECRET');
  if (secret) return secret;
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('Thiếu JWT_SECRET trong biến môi trường');
  }
  new Logger('AuthCore').warn('Chưa có JWT_SECRET, đang dùng khóa tạm cho máy dev');
  return DEV_FALLBACK_SECRET;
};

/** Cấu hình JWT dùng chung cho guard và module auth. Access token sống 15 phút (ADR 0001). */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class AuthCoreModule {}
