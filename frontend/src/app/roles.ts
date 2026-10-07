/** Vai trò theo cột users.role trong ERD v3. */
export type Role = 'ADMIN' | 'STAFF' | 'TRAINER' | 'MEMBER';

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Quản trị',
  STAFF: 'Nhân viên quầy',
  TRAINER: 'Huấn luyện viên (PT)',
  MEMBER: 'Hội viên',
};

/** Trang đầu tiên sau khi đăng nhập, theo bản đồ route trong docs/design/fe-architecture.md. */
export const ROLE_HOME: Record<Role, string> = {
  MEMBER: '/member',
  TRAINER: '/trainer/schedule',
  STAFF: '/staff/check-in',
  ADMIN: '/admin',
};
