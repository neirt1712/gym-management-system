import { HttpException, HttpStatus } from '@nestjs/common';
import { AppError } from './app-error';
import type { ErrorCode } from './codes';

export type ErrorBody = { code: ErrorCode; message: string; details: unknown };
export type ErrorResult = { status: number; body: ErrorBody };

/** Lỗi do Nest tự ném (sai route, sai phương thức…) đổi sang mã chung. */
const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
};

const INTERNAL: ErrorResult = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  body: { code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống', details: null },
};

/** JSON gửi lên sai cú pháp: body-parser ném lỗi có status 400 và type riêng. */
const isBodyParseError = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { type?: unknown }).type === 'entity.parse.failed';

/** Hàm thuần: đổi mọi loại lỗi thành status + body theo mẫu chung. Dễ test, không phụ thuộc request. */
export const toErrorResponse = (exception: unknown): ErrorResult => {
  if (exception instanceof AppError) {
    return {
      status: exception.status,
      body: { code: exception.code, message: exception.message, details: exception.details },
    };
  }

  if (isBodyParseError(exception)) {
    return {
      status: HttpStatus.BAD_REQUEST,
      body: { code: 'VALIDATION_ERROR', message: 'JSON không hợp lệ', details: null },
    };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status >= 500) return INTERNAL;
    const code = CODE_BY_STATUS[status] ?? 'VALIDATION_ERROR';
    return {
      status: CODE_BY_STATUS[status] ? status : HttpStatus.BAD_REQUEST,
      body: { code, message: exception.message, details: null },
    };
  }

  return INTERNAL;
};
