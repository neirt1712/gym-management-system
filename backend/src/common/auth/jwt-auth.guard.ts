import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError } from '../errors/app-error';
import type { AuthUser, RequestWithContext } from '../http/request-context';
import { IS_PUBLIC_KEY } from './decorators';
import { ROLES, type Role } from './role';

/** Nội dung access token: sub = users.id, role, tv = users.token_version (ADR 0001). */
export type AccessTokenPayload = { sub: string; role: Role; tv: number };

const isPayload = (p: Partial<AccessTokenPayload>): p is AccessTokenPayload =>
  typeof p.sub === 'string' && ROLES.includes(p.role as Role) && typeof p.tv === 'number';

/**
 * Chặn mọi endpoint chưa đăng nhập, trừ endpoint có @Public().
 * Đọc header Authorization: Bearer <access token>, kiểm chữ ký và hạn, gắn req.user.
 * Endpoint @Public() có token hợp lệ vẫn gắn req.user (ví dụ GET /packages: Admin thấy cả gói ngừng bán);
 * token thiếu hoặc sai thì coi như khách, không báo lỗi.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest<RequestWithContext>();

    try {
      req.user = await this.readUser(req);
    } catch (e) {
      if (!isPublic) throw e;
    }
    return true;
  }

  private async readUser(req: RequestWithContext): Promise<AuthUser> {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new AppError('UNAUTHENTICATED');

    let payload: Partial<AccessTokenPayload>;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new AppError('UNAUTHENTICATED');
    }
    if (!isPayload(payload)) throw new AppError('UNAUTHENTICATED');

    // So với users.token_version: cách thu hồi mọi phiên khi khóa tài khoản hoặc đổi mật khẩu (ADR 0001).
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { tokenVersion: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE' || user.tokenVersion !== payload.tv) {
      throw new AppError('UNAUTHENTICATED');
    }
    return { id: payload.sub, role: payload.role, tokenVersion: payload.tv };
  }
}
