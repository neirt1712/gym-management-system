import { Alert, Typography } from 'antd';
import type { ReactNode } from 'react';
import { getErrorMessage, getRequestId } from '../../lib/errors';
import { space } from '../../theme/tokens';

type Props = { error: unknown; action?: ReactNode };

/**
 * Lỗi của một form hoặc thao tác: thông điệp theo error.code, mã yêu cầu chữ nhỏ để gửi cho nhóm khi báo lỗi.
 * Tạm dùng tới khi có `ErrorState` dùng chung của Bằng (components/).
 */
export const ApiErrorAlert = ({ error, action }: Props) => {
  const requestId = getRequestId(error);
  return (
    <Alert
      type="error"
      showIcon
      role="alert"
      style={{ marginBottom: space.md }}
      message={getErrorMessage(error)}
      action={action}
      description={
        requestId ? <Typography.Text type="secondary">Mã yêu cầu: {requestId}</Typography.Text> : undefined
      }
    />
  );
};
