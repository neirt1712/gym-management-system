import { Button, Card, Input, Space, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, EmptyState, ErrorState, PageHeader } from '../../components';
import { useTrainers, type Trainer } from '../../features/trainers/api';
import { space } from '../../theme/tokens';

/**
 * UC22, UC33 Huấn luyện viên (`/admin/trainers`): danh sách PT, mở hồ sơ và khung giờ.
 * Tạo PT, khóa tài khoản PT làm ở màn Tài khoản. Sửa hồ sơ PT thay PT chưa làm.
 */
export const AdminTrainersPage = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data, isPending, isFetching, isError, error, refetch } = useTrainers({
    pageSize: 100,
    ...(q ? { q } : {}),
  });

  const columns: TableColumnsType<Trainer> = [
    { title: 'Họ tên', dataIndex: 'fullName' },
    {
      title: 'Chuyên môn',
      render: (_, t) => (
        <Space wrap>
          {t.specialties.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Kinh nghiệm',
      render: (_, t) => (t.experienceYears === null ? '—' : `${t.experienceYears} năm`),
    },
    {
      title: 'Trạng thái',
      render: (_, t) =>
        t.status === 'ACTIVE' ? <Tag color="success">Đang nhận lịch</Tag> : <Tag>Ngừng nhận lịch</Tag>,
    },
    {
      title: 'Thao tác',
      render: (_, t) => <Button onClick={() => navigate(`/trainers/${t.id}`)}>Xem hồ sơ</Button>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Huấn luyện viên"
        description="Danh sách PT. Tạo hoặc khóa tài khoản PT ở màn Tài khoản."
        extra={
          <Button type="primary" onClick={() => navigate('/admin/users')}>
            Tạo tài khoản PT
          </Button>
        }
      />
      <Input.Search
        aria-label="Tìm huấn luyện viên"
        placeholder="Tìm theo tên"
        allowClear
        onSearch={(v) => setQ(v.trim())}
        style={{ width: 280, marginBottom: space.md }}
      />
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <Card>
          <DataTable<Trainer>
            columns={columns}
            rows={data?.data}
            rowKey="id"
            loading={isPending || isFetching}
            empty={<EmptyState description="Chưa có huấn luyện viên nào" />}
          />
        </Card>
      )}
    </div>
  );
};
