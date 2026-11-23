import type { CookieOptions, Request, Response } from 'express';

export const REFRESH_COOKIE = 'refresh_token';
/** openapi SetRefreshCookie: Max-Age=604800 (7 ngày). */
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/api/v1/auth',
});

export const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions(), maxAge: REFRESH_TTL_SECONDS * 1000 });
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
};

/** Đọc cookie từ header, để khỏi thêm thư viện cookie-parser chỉ cho một cookie. */
export const readRefreshCookie = (req: Request): string | undefined => {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const separator = part.indexOf('=');
    if (separator > 0 && part.slice(0, separator).trim() === REFRESH_COOKIE) {
      return part.slice(separator + 1).trim();
    }
  }
  return undefined;
};
