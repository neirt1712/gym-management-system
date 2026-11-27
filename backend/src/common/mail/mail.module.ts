import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/** Gửi email dùng chung (đặt lại mật khẩu). Global để module nào cũng inject được. */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
