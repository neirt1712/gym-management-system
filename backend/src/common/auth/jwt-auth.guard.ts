import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AppError } from '../errors/app-error';
import type { RequestWithContext } from '../http/request-context';
import { IS_PUBLIC_KEY } from './decorators';
import { ROLES, type Role } from './role';

/** Nội dung access token: sub = users.id, role, tv = users.token_version (ADR 0001). */
export type AccessTokenPayload = { sub: string; role: Role; tv: number };

const isPayload = (p: Partial<AccessTokenPayload>): p is AccessTokenPayload =>
  typeof p.sub === 'string' && ROLES.includes(p.role as Role) && typeof p.tv === 'number';

/**
 * Chặn mọi endpoint chưa đăng nhập, trừ endpoint có @Public().
 * Đọc header Authorization: Bearer <access token>, kiểm chữ ký và hạn, gắn req.user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<RequestWithContext>();
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new AppError('UNAUTHENTICATED');

    let payload: Partial<AccessTokenPayload>;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new AppError('UNAUTHENTICATED');
    }
    if (!isPayload(payload)) throw new AppError('UNAUTHENTICATED');

    // TODO(tuần 2, khi có Prisma): so payload.tv với users.token_version; khác thì UNAUTHENTICATED.
    // Đây là cách thu hồi mọi phiên khi khóa tài khoản hoặc đổi mật khẩu (ADR 0001).
    req.user = { id: payload.sub, role: payload.role, tokenVersion: payload.tv };
    return true;
  }
}
