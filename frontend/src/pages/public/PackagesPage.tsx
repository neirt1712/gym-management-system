import { CheckOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Input, Row, Segmented, Skeleton, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageError } from '../../app/feedback/PageError';
import { useAuth } from '../../features/auth';
import { usePackages, type PackageListQuery } from '../../features/packages/api';
import type { Package } from '../../features/purchase/api';
import { formatDuration, formatVND } from '../../lib/format';
import { space } from '../../theme/tokens';

type TypeFilter = 'ALL' | NonNullable<PackageListQuery['type']>;

const TYPE_OPTIONS: { label: string; value: TypeFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Gym', value: 'GYM' },
  { label: 'PT', value: 'PT' },
];

/** Đủ chỗ cho mọi gói đang bán, không cần phân trang. */
const PAGE_SIZE = 100;

const PackageCard = ({ pkg, canBuy, onBuy }: { pkg: Package; canBuy: boolean; onBuy: () => void }) => (
  <Card
    title={pkg.name}
    extra={<Tag>{pkg.type === 'PT' ? 'PT' : 'Gym'}</Tag>}
    style={{ height: '100%' }}
    styles={{ body: { display: 'flex', flexDirection: 'column', gap: space.md, height: '100%' } }}
  >
    <div>
      <Typography.Title level={3} style={{ margin: 0 }}>
        {formatVND(pkg.price)}
      </Typography.Title>
      <Typography.Text type="secondary">
        {formatDuration(pkg.durationValue, pkg.durationUnit)}
        {pkg.totalSessions !== null && ` · ${pkg.totalSessions} buổi PT, ${pkg.sessionMinutes} phút/buổi`}
        {pkg.includesClass && ' · Có lớp học'}
      </Typography.Text>
    </div>
    {pkg.description && <Typography.Paragraph style={{ margin: 0 }}>{pkg.description}</Typography.Paragraph>}
    {pkg.benefits.length > 0 && (
      <Space direction="vertical" size={space.xs}>
        {pkg.benefits.map((b) => (
          <Typography.Text key={b}>
            <CheckOutlined aria-hidden style={{ marginRight: space.sm }} />
            {b}
          </Typography.Text>
        ))}
      </Space>
    )}
    {canBuy && (
      <Button block onClick={onBuy} style={{ marginTop: 'auto' }}>
        Mua gói
      </Button>
    )}
  </Card>
);

/**
 * UC07 Danh mục gói (`/packages`, công khai). Bản tạm cho demo: tìm theo tên, lọc loại, nút "Mua gói" dẫn sang UC09.
 * Chưa có: chi tiết `/packages/:id`, so sánh gói, lọc giá và thời hạn.
 */
export const PackagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [type, setType] = useState<TypeFilter>('ALL');
  const params: PackageListQuery = {
    pageSize: PAGE_SIZE,
    ...(q ? { q } : {}),
    ...(type !== 'ALL' ? { type } : {}),
  };
  const { data, isPending, isError, error, refetch } = usePackages(params);

  // Chưa đăng nhập vẫn thấy nút: bấm thì RequireAuth đưa tới đăng nhập rồi quay lại trang mua
  const canBuy = !user || user.role === 'MEMBER';
  const resetFilters = () => {
    setQ('');
    setType('ALL');
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Typography.Title level={2} style={{ marginTop: 0 }}>
        Gói tập
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Chọn gói phù hợp rồi mua trực tuyến hoặc tại quầy.
      </Typography.Paragraph>

      <Space
        wrap
        size={space.md}
        style={{ marginBottom: space.lg, width: '100%', justifyContent: 'space-between' }}
      >
        <Space wrap size={space.md}>
          <Input.Search
            aria-label="Tìm gói theo tên"
            placeholder="Tìm theo tên gói"
            allowClear
            defaultValue={q}
            key={q === '' ? 'empty' : 'filled'}
            onSearch={(value) => setQ(value.trim())}
            style={{ width: 280 }}
          />
          <Segmented aria-label="Loại gói" options={TYPE_OPTIONS} value={type} onChange={setType} />
        </Space>
        <Button onClick={resetFilters}>Đặt lại</Button>
      </Space>

      {isPending ? (
        <Row gutter={[space.lg, space.lg]} aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Col key={i} xs={24} md={12} xl={8}>
              <Card>
                <Skeleton active paragraph={{ rows: 5 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : isError ? (
        <PageError error={error} onRetry={() => void refetch()} />
      ) : data.data.length === 0 ? (
        <Card>
          <Empty description="Không có gói nào khớp bộ lọc">
            <Button onClick={resetFilters}>Xem tất cả gói</Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[space.lg, space.lg]}>
          {data.data.map((pkg) => (
            <Col key={pkg.id} xs={24} md={12} xl={8}>
              <PackageCard pkg={pkg} canBuy={canBuy} onBuy={() => navigate(`/member/purchase/${pkg.id}`)} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};
