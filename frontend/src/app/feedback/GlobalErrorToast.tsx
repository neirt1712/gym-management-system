import { App } from 'antd';
import { useEffect } from 'react';
import { getErrorCode } from '../../lib/errors';

export type ErrorNotifier = (error: unknown) => void;

/** Lỗi không phải dạng `{error:{code}}` của API: fetch không tới được máy chủ. */
const isNetworkError = (error: unknown): boolean => getErrorCode(error) === undefined;

/**
 * Báo lỗi chung cho mọi query và mutation (fe-architecture.md, mục Mã HTTP):
 * - 403 FORBIDDEN → "không có quyền";
 * - không kết nối được máy chủ → nhắc kiểm tra mạng.
 * Lỗi 400, 409, 422, 429 đã hiện ngay trên form hoặc màn (ApiErrorAlert, ErrorState) nên không báo lại ở đây.
 */
export const GlobalErrorToast = ({ register }: { register: (notify: ErrorNotifier) => void }) => {
  const { message } = App.useApp();

  useEffect(() => {
    register((error) => {
      if (getErrorCode(error) === 'FORBIDDEN') {
        void message.error({ key: 'forbidden', content: 'Bạn không có quyền làm việc này.' });
      } else if (isNetworkError(error)) {
        void message.error({
          key: 'network',
          content: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
        });
      }
    });
  }, [message, register]);

  return null;
};
