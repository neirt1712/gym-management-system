import { ValidationPipe, type ValidationError } from '@nestjs/common';
import { AppError } from '../errors/app-error';

export type FieldError = { field: string; messages: string[] };

/** Làm phẳng lỗi class-validator: { field: 'address.city', messages: [...] }. */
export const toFieldErrors = (errors: ValidationError[], parent = ''): FieldError[] =>
  errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property;
    const own = e.constraints ? [{ field, messages: Object.values(e.constraints) }] : [];
    return [...own, ...toFieldErrors(e.children ?? [], field)];
  });

/**
 * ValidationPipe dùng cho cả app:
 * - whitelist: bỏ field không khai báo trong DTO; forbidNonWhitelisted: gửi field lạ thì báo lỗi;
 * - transform: đổi query string sang số, boolean theo kiểu DTO;
 * - lỗi trả VALIDATION_ERROR, details liệt kê field sai.
 */
export const createValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new AppError('VALIDATION_ERROR', toFieldErrors(errors)),
  });
