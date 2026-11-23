import type { User } from '@prisma/client';

/** openapi: SessionUser. */
export const toSessionUser = (user: User) => ({
  id: user.id,
  fullName: user.fullName,
  role: user.role,
  phone: user.phone,
  email: user.email,
  avatarUrl: user.avatarUrl,
});

/** openapi: AuthSession. Refresh token đi riêng qua cookie, không nằm trong body. */
export type AuthSessionResponse = {
  accessToken: string;
  expiresIn: number;
  user: ReturnType<typeof toSessionUser>;
};
