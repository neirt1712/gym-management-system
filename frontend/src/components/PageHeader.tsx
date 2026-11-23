import { Space, Typography } from 'antd';
import type { ReactNode } from 'react';
import { space } from '../theme/tokens';

type Props = {
  /** Danh từ, ví dụ "Hội viên". */
  title: ReactNode;
  /** Một dòng mô tả ngắn, không bắt buộc. */
  description?: ReactNode;
  /** Nút chính ở góc phải; mỗi màn tối đa một nút primary. */
  extra?: ReactNode;
};

/** Đầu trang dùng chung (frontend-ui.md, mục Bố cục một trang). */
export const PageHeader = ({ title, description, extra }: Props) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: space.md,
      marginBottom: space.lg,
    }}
  >
    <div>
      <Typography.Title level={2} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      {description && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: space.xs }}>
          {description}
        </Typography.Text>
      )}
    </div>
    {extra && <Space wrap>{extra}</Space>}
  </div>
);
