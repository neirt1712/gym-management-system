import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { AccessTokenPayload } from '../../common/auth/jwt-auth.guard';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { BUSINESS } from '../../config/business.config';
import { PrismaService } from '../../prisma/prisma.service';
import { nextMemberCode } from '../members/member-code';
import { fromDateOnly } from '../members/member.response';
import { toSessionUser, type AuthSessionResponse } from './auth.response';
import type { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { REFRESH_TTL_SECONDS } from './refresh-cookie';

/** Nội dung refresh token: tv = users.token_version, typ để không dùng lẫn với access token. */
type RefreshTokenPayload = { sub: string; tv: number; typ: 'refresh' };

/** Kết quả nội bộ: controller đặt refreshToken vào cookie, chỉ trả session trong body. */
export type IssuedSession = { session: AuthSessionResponse; refreshToken: string };

const { bcryptCost, maxFailedLogins, tempLockMinutes, accessTokenMinutes } = BUSINESS.auth;

/** So với hash giả khi SĐT không tồn tại, để thời gian phản hồi không lộ SĐT đã đăng ký. */
const DUMMY_HASH = bcrypt.hashSync(randomBytes(16).toString('hex'), bcryptCost);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** UC01. Tạo tài khoản MEMBER kèm hồ sơ hội viên rồi đăng nhập luôn. */
  async register(dto: RegisterDto): Promise<IssuedSession> {
    const email = dto.email ?? null;
    await this.assertContactFree(dto.phone, email);

    const passwordHash = await bcrypt.hash(dto.password, bcryptCost);
    let user: User;
    try {
      user = await this.prisma.$transaction(async (tx) => {
        const memberCode = await nextMemberCode(tx);
        const created = await tx.user.create({
          data: {
            phone: dto.phone,
            fullName: dto.fullName,
            email,
            dob: dto.dob ? fromDateOnly(dto.dob) : null,
            passwordHash,
            role: 'MEMBER',
          },
        });
        await tx.member.create({
          data: { userId: created.id, memberCode, qrToken: randomBytes(16).toString('hex') },
        });
        return created;
      });
    } catch (e) {
      // Hai yêu cầu cùng SĐT/email chạy song song: unique constraint chặn, kiểm lại để báo đúng mã
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        await this.assertContactFree(dto.phone, email);
      }
      throw e;
    }
    return this.issueSession(user);
  }

  /** UC02. Sai 5 lần liên tiếp thì khóa tạm; đúng thì đếm lại từ 0. */
  async login(dto: LoginDto): Promise<IssuedSession> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new AppError('INVALID_CREDENTIALS');
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      throw this.temporarilyLocked(user.lockedUntil, now);
    }

    // Hồ sơ tại quầy chưa kích hoạt không có mật khẩu: báo như sai mật khẩu, không tính vào số lần sai
    if (!user.passwordHash) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new AppError('INVALID_CREDENTIALS');
    }

    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      await this.recordFailedLogin(user.id, now);
    }

    if (user.status === 'LOCKED') throw new AppError('ACCOUNT_LOCKED');

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null },
    });
    return this.issueSession(updated);
  }

  /** UC02. Đổi refresh token mỗi lần gọi. Phiên đã thu hồi (khóa, đổi mật khẩu) thì 401. */
  async refresh(token: string | undefined): Promise<IssuedSession> {
    if (!token) throw new AppError('UNAUTHENTICATED');

    let payload: Partial<RefreshTokenPayload>;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(token);
    } catch {
      throw new AppError('UNAUTHENTICATED');
    }
    if (payload.typ !== 'refresh' || typeof payload.sub !== 'string') {
      throw new AppError('UNAUTHENTICATED');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE' || user.tokenVersion !== payload.tv) {
      throw new AppError('UNAUTHENTICATED');
    }
    return this.issueSession(user);
  }

  /** UC06. Thu hồi phiên ở thiết bị khác; thiết bị hiện tại nhận phiên mới. */
  async changePassword(dto: ChangePasswordDto, authUser: AuthUser): Promise<IssuedSession> {
    const user = await this.prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user) throw new AppError('UNAUTHENTICATED');

    const matches = user.passwordHash ? await bcrypt.compare(dto.currentPassword, user.passwordHash) : false;
    if (!matches) {
      // openapi: dùng 400 thay vì 401 để FE không nhầm là hết phiên và gọi refresh
      const message = 'Mật khẩu hiện tại không đúng';
      throw new AppError('VALIDATION_ERROR', [{ field: 'currentPassword', messages: [message] }], message);
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, bcryptCost),
        tokenVersion: { increment: 1 },
      },
    });
    return this.issueSession(updated);
  }

  /** Hồ sơ tại quầy chưa có mật khẩu thì hướng dẫn kích hoạt, không báo trùng (UC01). */
  private async assertContactFree(phone: string, email: string | null): Promise<void> {
    const byPhone = await this.prisma.user.findUnique({ where: { phone } });
    if (byPhone) {
      const notActivated = byPhone.role === 'MEMBER' && !byPhone.passwordHash;
      throw new AppError(notActivated ? 'ACTIVATION_REQUIRED' : 'PHONE_DUPLICATED');
    }
    if (email && (await this.prisma.user.findUnique({ where: { email } }))) {
      throw new AppError('EMAIL_DUPLICATED');
    }
  }

  /** Tăng số lần sai trong DB để nhiều yêu cầu song song vẫn đếm đúng. Hàm này luôn ném lỗi. */
  private async recordFailedLogin(userId: string, now: Date): Promise<never> {
    const { failedLogins } = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLogins: { increment: 1 } },
      select: { failedLogins: true },
    });
    if (failedLogins < maxFailedLogins) throw new AppError('INVALID_CREDENTIALS');

    const lockedUntil = new Date(now.getTime() + tempLockMinutes * 60_000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLogins: 0, lockedUntil },
    });
    throw this.temporarilyLocked(lockedUntil, now);
  }

  private temporarilyLocked(lockedUntil: Date, now: Date): AppError {
    const retryAfterSeconds = Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000);
    return new AppError('ACCOUNT_TEMPORARILY_LOCKED', { retryAfterSeconds });
  }

  private async issueSession(user: User): Promise<IssuedSession> {
    const access: AccessTokenPayload = { sub: user.id, role: user.role, tv: user.tokenVersion };
    const refresh: RefreshTokenPayload = { sub: user.id, tv: user.tokenVersion, typ: 'refresh' };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(access),
      this.jwt.signAsync(refresh, { expiresIn: REFRESH_TTL_SECONDS }),
    ]);
    return {
      session: { accessToken, expiresIn: accessTokenMinutes * 60, user: toSessionUser(user) },
      refreshToken,
    };
  }
}
