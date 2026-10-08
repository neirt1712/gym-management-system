import { Skeleton } from 'antd';
import { space } from '../../theme/tokens';

/** Khung chờ khi đang khôi phục phiên. Không dùng spinner toàn trang. */
export const PageSkeleton = () => (
  <div style={{ padding: space.lg }} aria-busy="true">
    <Skeleton active title paragraph={{ rows: 6 }} />
  </div>
);
