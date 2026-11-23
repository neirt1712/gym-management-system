import type { Role } from '../auth/role';
import { AppError } from '../errors/app-error';
import type { AuthUser } from '../http/request-context';

/**
 * Chủ của một tài nguyên, ghi bằng `users.id` (khớp `AuthUser.id`), không phải `members.id`/`trainers.id`.
 * Service tự tra ra hai giá trị này khi đọc tài nguyên, ví dụ lịch PT:
 *   { memberUserId: appointment.member.userId, trainerUserId: appointment.trainer.userId }
 * "PT phụ trách hội viên" (quyết định 16) cần tra lịch, service tính rồi truyền `trainerUserId` khi đúng.
 */
export type Owners = {
  memberUserId?: string | null;
  trainerUserId?: string | null;
};

export type OwnershipOptions = {
  /**
   * Vai trò xem được mọi tài nguyên loại này. Mặc định ADMIN, STAFF; truyền `['ADMIN']` khi Staff không được xem
   * (ví dụ nhóm Theo dõi tập). Chặn theo vai trò vẫn đặt ở `@Roles` (trả 403); `allowRoles` chỉ áp cho vai trò đã qua guard.
   */
  allowRoles?: readonly Role[];
};

const DEFAULT_ALLOW_ROLES: readonly Role[] = ['ADMIN', 'STAFF'];

/** Người gọi có quyền trên tài nguyên không: vai trò được phép, hoặc đúng hội viên / PT sở hữu. */
export const canAccess = (user: AuthUser, owners: Owners, options: OwnershipOptions = {}): boolean => {
  const allowRoles = options.allowRoles ?? DEFAULT_ALLOW_ROLES;
  if (allowRoles.includes(user.role)) return true;
  if (user.role === 'MEMBER') return owners.memberUserId === user.id;
  if (user.role === 'TRAINER') return owners.trainerUserId === user.id;
  return false;
};

/**
 * Bước đầu của mọi service đọc/ghi theo `{id}` (`.claude/rules/backend.md`).
 * Không có quyền thì ném NOT_FOUND, không phải FORBIDDEN, để không lộ tài nguyên có tồn tại (openapi, mục Vai trò).
 */
export function assertOwnership(user: AuthUser, owners: Owners, options?: OwnershipOptions): void {
  if (!canAccess(user, owners, options)) throw new AppError('NOT_FOUND');
}

/** Tài nguyên không có trong DB thì NOT_FOUND. Dùng ngay sau `findUnique` để TypeScript bỏ `null`. */
export function assertFound<T>(resource: T | null | undefined): asserts resource is T {
  if (resource === null || resource === undefined) throw new AppError('NOT_FOUND');
}
