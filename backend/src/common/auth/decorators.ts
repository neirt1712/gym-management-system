import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { AuthUser, RequestWithContext } from '../http/request-context';
import type { Role } from './role';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Endpoint không cần đăng nhập (đăng ký, đăng nhập, xem gói, IPN VNPay, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Chỉ các vai trò này được gọi. Không gắn @Roles nghĩa là mọi người đã đăng nhập. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Lấy người dùng đang gọi API: `me(@CurrentUser() user: AuthUser)`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined =>
    ctx.switchToHttp().getRequest<RequestWithContext>().user,
);
