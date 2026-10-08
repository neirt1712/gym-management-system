import { ERROR_HTTP_STATUS, type ErrorCode } from './codes';

/**
 * Cách duy nhất để báo lỗi nghiệp vụ. HTTP status lấy từ danh mục, không truyền tay.
 *
 *   throw new AppError('PENDING_ORDER_EXISTS', { orderId });
 *
 * Filter chung đổi lỗi này thành {error:{code,message,details,requestId}}.
 */
export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    readonly details: unknown = null,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AppError';
    this.status = ERROR_HTTP_STATUS[code];
  }
}
