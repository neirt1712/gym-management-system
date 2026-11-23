import { Empty } from 'antd';
import type { ReactNode } from 'react';

type Props = {
  /** Một câu giải thích, ví dụ "Bạn chưa có lịch tập nào". */
  description: ReactNode;
  /** Nút dẫn tới hành động tiếp theo. */
  action?: ReactNode;
};

/** Trạng thái rỗng dùng chung: một câu giải thích và một nút hành động (frontend-ui.md). */
export const EmptyState = ({ description, action }: Props) => (
  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description}>
    {action}
  </Empty>
);
