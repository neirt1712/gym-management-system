import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { AppError } from '../../common/errors/app-error';
import { MailService } from '../../common/mail/mail.service';
import { BUSINESS } from '../../config/business.config';
import { PrismaService } from '../../prisma/prisma.service';
import type { ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

const { bcryptCost, passwordResetTokenMinutes } = BUSINESS.auth;
/** Giới hạn gọi quên mật khẩu theo SĐT (openapi: 429 RATE_LIMITED). Số lần do Triển chọn 27/11, chưa có tài liệu chốt. */
const RATE_LIMIT = { max: 3, windowMinutes: 15 };

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/**
 * UC04 quên mật khẩu, cũng dùng để kích hoạt tài khoản tạo tại quầy (chưa có mật khẩu).
 * Chỉ lưu hash của token (bảng password_reset_tokens); token gốc chỉ nằm trong link email.
 */
@Injectable()
export class PasswordResetService {
  /** Lần gọi gần đây theo SĐT, giữ trong bộ nhớ (một tiến trình, chạy local theo Q23). */
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  /** Luôn trả bình thường (controller trả 202), kể cả SĐT không có hoặc tài khoản không có email (Q17a). */
  async forgot(dto: ForgotPasswordDto, now: Date = new Date()): Promise<void> {
    this.assertNotTooMany(dto.phone, now);
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user || !user.email || user.status !== 'ACTIVE') return;

    const token = randomBytes(32).toString('hex');
    await this.prisma.$transaction([
      // Link cũ chưa dùng hết hiệu lực khi xin link mới
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256(token),
          expiresAt: new Date(now.getTime() + passwordResetTokenMinutes * 60_000),
        },
      }),
    ]);

    const appUrl = (this.config.get<string>('APP_URL') ?? 'http://localhost:5173').replace(/\/+$/, '');
    const link = `${appUrl}/reset-password?token=${token}`;
    const activating = !user.passwordHash;
    await this.mail.send({
      to: user.email,
      subject: activating ? 'Kích hoạt tài khoản phòng gym' : 'Đặt lại mật khẩu phòng gym',
      text:
        `Chào ${user.fullName},\n\n` +
        `Bấm vào link sau để ${activating ? 'đặt mật khẩu và kích hoạt tài khoản' : 'đặt mật khẩu mới'} ` +
        `(hết hạn sau ${passwordResetTokenMinutes} phút, chỉ dùng một lần):\n${link}\n\n` +
        'Nếu bạn không yêu cầu, hãy bỏ qua email này.',
    });
  }

  /** Token sai, hết hạn hoặc đã dùng: 400 TOKEN_EXPIRED. Thành công: đặt mật khẩu, mở khóa tạm, thu hồi mọi phiên. */
  async reset(dto: ResetPasswordDto, now: Date = new Date()): Promise<void> {
    const passwordHash = await bcrypt.hash(dto.newPassword, bcryptCost);
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.passwordResetToken.findUnique({ where: { tokenHash: sha256(dto.token) } });
      if (!row || row.usedAt || row.expiresAt < now) throw new AppError('TOKEN_EXPIRED');
      // Đánh dấu đã dùng có điều kiện: hai request cùng token thì chỉ một cái đổi được
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: row.id, usedAt: null },
        data: { usedAt: now },
      });
      if (claimed.count === 0) throw new AppError('TOKEN_EXPIRED');
      await tx.user.update({
        where: { id: row.userId },
        data: { passwordHash, tokenVersion: { increment: 1 }, failedLogins: 0, lockedUntil: null },
      });
    });
  }

  private assertNotTooMany(phone: string, now: Date): void {
    const since = now.getTime() - RATE_LIMIT.windowMinutes * 60_000;
    const recent = (this.attempts.get(phone) ?? []).filter((t) => t > since);
    if (recent.length >= RATE_LIMIT.max) {
      this.attempts.set(phone, recent);
      throw new AppError('RATE_LIMITED');
    }
    recent.push(now.getTime());
    this.attempts.set(phone, recent);
  }
}
