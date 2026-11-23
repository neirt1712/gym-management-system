import { Skeleton, Table, type TableColumnsType } from 'antd';
import type { ReactNode } from 'react';

/** openapi PageMeta. */
export type PageMeta = { page: number; pageSize: number; total: number; totalPages: number };

type Props<T> = {
  columns: TableColumnsType<T>;
  rows: T[] | undefined;
  rowKey: keyof T & string;
  loading?: boolean;
  /** Có meta thì hiện phân trang theo dữ liệu BE trả về. */
  meta?: PageMeta;
  onPageChange?: (page: number, pageSize: number) => void;
  /** Nội dung khi không có dòng nào, thường là <EmptyState />. */
  empty?: ReactNode;
};

/**
 * Bảng danh sách dùng chung: phân trang theo `{data, meta}` của API, cuộn ngang trên màn hẹp.
 * Chưa có dữ liệu thì hiện Skeleton (frontend-ui.md: đang tải dùng Skeleton). Không dùng `loading` của Table:
 * Spin bên trong tắt lớp phủ chặn bấm chậm một lần vẽ, nên dòng mới hiện ra có lúc chưa bấm được.
 * Khi tải lại (đổi trang, sau khi xác nhận) vẫn giữ bảng cũ bấm được.
 */
export const DataTable = <T extends object>({
  columns,
  rows,
  rowKey,
  loading,
  meta,
  onPageChange,
  empty,
}: Props<T>) =>
  loading && rows === undefined ? (
    <Skeleton active paragraph={{ rows: 5 }} aria-busy="true" />
  ) : (
    <Table<T>
      columns={columns}
      dataSource={rows}
      rowKey={rowKey}
      scroll={{ x: 'max-content' }}
      locale={empty ? { emptyText: empty } : undefined}
      pagination={
        meta
          ? {
              current: meta.page,
              pageSize: meta.pageSize,
              total: meta.total,
              showSizeChanger: false,
              showTotal: (total) => `${total} dòng`,
              onChange: onPageChange,
            }
          : false
      }
    />
  );
