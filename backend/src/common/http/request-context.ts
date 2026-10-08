import type { Request } from 'express';
import type { Role } from '../auth/role';

/** Người dùng đã xác thực, do JwtAuthGuard gắn vào request. */
export type AuthUser = { id: string; role: Role; tokenVersion: number };

export type RequestWithContext = Request & { requestId?: string; user?: AuthUser };
