/** Vai trò theo cột users.role trong ERD v3. */
export const ROLES = ['ADMIN', 'STAFF', 'TRAINER', 'MEMBER'] as const;
export type Role = (typeof ROLES)[number];
