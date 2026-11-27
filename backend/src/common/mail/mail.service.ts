import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export type MailMessage = { to: string; subject: string; text: string };

/**
 * Gửi email qua SMTP (Nodemailer, ADR 0001). Chạy local trỏ tới MailHog trong docker-compose (cổng 1025),
 * xem thư ở http://localhost:8025. Biến môi trường: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM.
 * Gửi lỗi chỉ ghi log, không ném lỗi: người gọi (quên mật khẩu) luôn trả 202 để không lộ SĐT đã đăng ký.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  async send(message: MailMessage): Promise<boolean> {
    try {
      await this.transport().sendMail({
        from: this.config.get<string>('MAIL_FROM') ?? 'Gym <no-reply@gym.local>',
        ...message,
      });
      return true;
    } catch (e) {
      this.logger.error(`Không gửi được email tới ${message.to}`, e instanceof Error ? e.stack : String(e));
      return false;
    }
  }

  private transport(): Transporter {
    if (!this.transporter) {
      const user = this.config.get<string>('SMTP_USER');
      this.transporter = createTransport({
        host: this.config.get<string>('SMTP_HOST') ?? 'localhost',
        port: Number(this.config.get<string>('SMTP_PORT') ?? 1025),
        secure: false,
        auth: user ? { user, pass: this.config.get<string>('SMTP_PASS') ?? '' } : undefined,
      });
    }
    return this.transporter;
  }
}
