import { Button, Result, Typography } from 'antd';
import { getErrorMessage, getRequestId } from '../../lib/errors';
import { space } from '../../theme/tokens';

type Props = { error: unknown; onRetry: () => void };

/** Trạng thái lỗi của cả trang: nói làm gì tiếp, nút Thử lại, mã yêu cầu chữ nhỏ. Tạm dùng tới khi có `ErrorState`. */
export const PageError = ({ error, onRetry }: Props) => {
  const requestId = getRequestId(error);
  return (
    <Result
      status="warning"
      title="Chưa tải được dữ liệu"
      subTitle={getErrorMessage(error)}
      extra={
        <>
          <Button type="primary" onClick={onRetry}>
            Thử lại
          </Button>
          {requestId && (
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: space.sm }}>
              Mã yêu cầu: {requestId}
            </Typography.Text>
          )}
        </>
      }
    />
  );
};
