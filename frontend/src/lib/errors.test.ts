import { describe, expect, it } from 'vitest';
import { getErrorDetails, getErrorMessage, getFieldErrors } from './errors';

const validation = {
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid',
    details: [
      { field: 'currentPassword', messages: ['Mật khẩu hiện tại không đúng'] },
      { field: 'khongCoTrongForm', messages: ['x'] },
    ],
    requestId: 'r1',
  },
};

describe('lib/errors', () => {
  it('getFieldErrors chỉ lấy ô có trong form', () => {
    expect(getFieldErrors(validation, ['currentPassword', 'newPassword'])).toEqual([
      { name: 'currentPassword', errors: ['Mật khẩu hiện tại không đúng'] },
    ]);
  });

  it('getFieldErrors bỏ qua lỗi không phải VALIDATION_ERROR', () => {
    expect(getFieldErrors({ error: { code: 'PHONE_DUPLICATED' } }, ['phone'])).toEqual([]);
  });

  it('getErrorDetails đọc details dạng object, bỏ dạng mảng', () => {
    expect(
      getErrorDetails({ error: { code: 'ACCOUNT_TEMPORARILY_LOCKED', details: { retryAfterSeconds: 60 } } }),
    ).toEqual({ retryAfterSeconds: 60 });
    expect(getErrorDetails(validation)).toBeUndefined();
  });

  it('có thông điệp cho 3 mã mới (Q16, Q21)', () => {
    for (const code of ['ORDER_NOT_PENDING', 'FREEZE_LIMIT_REACHED', 'CLASS_NOT_OPEN']) {
      expect(getErrorMessage({ error: { code } })).not.toBe('Có lỗi xảy ra. Thử lại sau.');
    }
  });
});
