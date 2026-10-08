import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../errors/app-error';
import type { RequestWithContext } from '../http/request-context';
import { ROLES_KEY } from './decorators';
import type { Role } from './role';

/**
 * Chạy sau JwtAuthGuard. Endpoint có @Roles(...) thì người gọi phải thuộc một trong các vai trò đó.
 * Quyền sở hữu (hội viên chỉ xem đơn của mình) kiểm trong service, không ở đây.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<RequestWithContext>();
    if (!user || !required.includes(user.role)) throw new AppError('FORBIDDEN');
    return true;
  }
}
