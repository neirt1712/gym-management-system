import { App, Button, Card, Input, Segmented, Select, Space, Switch } from 'antd';
import type { TableColumnsType } from 'antd';
import { useState } from 'react';
import { DataTable, EmptyState, ErrorState, PageHeader } from '../../components';
import { usePackages, useUpdatePackage, type PackageListQuery } from '../../features/packages/api';
import { PackageFormModal } from '../../features/packages/components/PackageFormModal';
import type { Package } from '../../features/purchase/api';
import { formatDuration, formatVND } from '../../lib/format';
import { space } from '../../theme/tokens';

type TypeFilter = 'ALL' | 'GYM' | 'PT';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const PAGE_SIZE = 20;

/** UC08 Quản trị gói (`/admin/packages`): thêm, sửa giá và quyền lợi, bật hoặc tắt bán. */
export const AdminPackagesPage = () => {
  const { message } = App.useApp();
  const [q, setQ] = useState('');
  const [type, setType] = useState<TypeFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Package | null>(null);
  const [creating, setCreating] = useState(false);
  const toggle = useUpdatePackage();

  const params: PackageListQuery = {
    page,
    pageSize: PAGE_SIZE,
    ...(q ? { q } : {}),
    ...(type !== 'ALL' ? { type } : {}),
    ...(status !== 'ALL' ? { status } : {}),
  };
  const { data, isPending, isFetching, isError, error, refetch } = usePackages(params);

  const reset = () => {
    setQ('');
    setType('ALL');
    setStatus('ALL');
    setPage(1);
  };

  const setSelling = (pkg: Package, selling: boolean) =>
    toggle.mutate(
      { id: pkg.id, body: { status: selling ? 'ACTIVE' : 'INACTIVE' } },
      {
        onSuccess: () => void message.success(selling ? 'Đã mở bán' : 'Đã ngừng bán'),
        onError: () => void message.error('Chưa đổi được trạng thái bán. Thử lại.'),
      },
    );

  const columns: TableColumnsType<Package> = [
    { title: 'Tên gói', dataIndex: 'name' },
    { title: 'Loại', render: (_, p) => (p.type === 'PT' ? 'Có PT' : 'Gym') },
    { title: 'Giá', render: (_, p) => formatVND(p.price) },
    { title: 'Thời hạn', render: (_, p) => formatDuration(p.durationValue, p.durationUnit) },
    {
      title: 'Buổi PT',
      render: (_, p) => (p.totalSessions === null ? '—' : `${p.totalSessions} × ${p.sessionMinutes} phút`),
    },
    { title: 'Vào lớp', render: (_, p) => (p.includesClass ? 'Có' : 'Không') },
    {
      title: 'Đang bán',
      render: (_, p) => (
        <Switch
          aria-label={`Đang bán ${p.name}`}
          checked={p.status === 'ACTIVE'}
          loading={toggle.isPending && toggle.variables?.id === p.id}
          onChange={(checked) => setSelling(p, checked)}
        />
      ),
    },
    { title: 'Thao tác', render: (_, p) => <Button onClick={() => setEditing(p)}>Sửa</Button> },
  ];

  return (
    <div>
      <PageHeader
        title="Gói tập"
        description="Thêm gói, sửa giá và quyền lợi, bật hoặc tắt bán. Đổi giá không ảnh hưởng đơn đã có."
        extra={
          <Button type="primary" onClick={() => setCreating(true)}>
            Thêm gói
          </Button>
        }
      />
      <Space
        wrap
        size={space.md}
        style={{ marginBottom: space.md, width: '100%', justifyContent: 'space-between' }}
      >
        <Space wrap size={space.md}>
          <Input.Search
            aria-label="Tìm gói"
            placeholder="Tìm theo tên gói"
            allowClear
            key={q === '' ? 'empty' : 'filled'}
            defaultValue={q}
            onSearch={(v) => {
              setQ(v.trim());
              setPage(1);
            }}
            style={{ width: 260 }}
          />
          <Segmented<TypeFilter>
            aria-label="Loại gói"
            value={type}
            onChange={(v) => {
              setType(v);
              setPage(1);
            }}
            options={[
              { label: 'Tất cả', value: 'ALL' },
              { label: 'Gym', value: 'GYM' },
              { label: 'Có PT', value: 'PT' },
            ]}
          />
          <Select<StatusFilter>
            aria-label="Trạng thái bán"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            style={{ width: 160 }}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang bán' },
              { value: 'INACTIVE', label: 'Ngừng bán' },
            ]}
          />
        </Space>
        <Button onClick={reset}>Đặt lại</Button>
      </Space>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <Card>
          <DataTable<Package>
            columns={columns}
            rows={data?.data}
            rowKey="id"
            loading={isPending || isFetching}
            meta={data?.meta}
            onPageChange={setPage}
            empty={
              <EmptyState
                description="Không có gói nào khớp bộ lọc"
                action={<Button onClick={() => setCreating(true)}>Thêm gói mới</Button>}
              />
            }
          />
        </Card>
      )}
      <PackageFormModal open={creating} onClose={() => setCreating(false)} />
      <PackageFormModal open={!!editing} pkg={editing ?? undefined} onClose={() => setEditing(null)} />
    </div>
  );
};
