import type { INestApplication } from '@nestjs/common';
import express from 'express';
import { requestIdMiddleware } from './common/http/request-id.middleware';
import { UPLOAD_DIR, UPLOAD_ROUTE } from './common/http/uploads';
import { createValidationPipe } from './common/http/validation';

export const API_PREFIX = 'api/v1';

/** Cấu hình dùng chung cho main.ts và test e2e, để test chạy giống hệt server thật. */
export const configureApp = (app: INestApplication): void => {
  app.use(requestIdMiddleware);
  // Ảnh đại diện đã tải lên (POST /uploads/avatar), công khai như ảnh trên web
  app.use(UPLOAD_ROUTE, express.static(UPLOAD_DIR, { fallthrough: false, index: false }));
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(createValidationPipe());
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
    credentials: true,
  });
};
