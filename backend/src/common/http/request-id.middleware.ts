import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { RequestWithContext } from './request-context';

const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Gắn requestId cho mọi request (chạy trước guard, nên cả lỗi 401 cũng có requestId).
 * Nhận X-Request-Id từ client nếu hợp lệ, không thì tự tạo. Trả lại trong header X-Request-Id.
 */
export const requestIdMiddleware = (req: RequestWithContext, res: Response, next: NextFunction): void => {
  const incoming = req.header('x-request-id');
  const id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};
