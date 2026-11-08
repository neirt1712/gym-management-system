import { Card, Empty, Button, Table, Tabs, Typography } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageError } from '../../app/feedback/PageError';
import { StatusTag } from '../../app/feedback/StatusTag';
import { useOrders, usePayments, type Order, type Payment } from '../../features/purchase/api';
import { formatDate, formatDateTime, formatVND } from '../../lib/format';

const PAGE_SIZE = 10;
const METHOD_LABEL = { VNPAY: 'VNPay', CASH: 'Tiền mặt' } as const;

const EmptyOrders = () => {
  const navigate = useNavigate();
  return (
    <Empty description="Bạn chưa có đơn nào">
      <Button type="primary" onClick={() => navigate('/packages')}>
        Xem gói tập
      </Button>
    </Empty>
  );
};

const OrdersTab = () => {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useOrders({ page, pageSize: PAGE_SIZE });
  if (isError) return <PageError error={error} onRetry={() => void refetch()} />;
  return (
    <Table<Order>
      rowKey="id"
      loading={isPending}
      dataSource={data?.data}
      locale={{ emptyText: isPending ? ' ' : <EmptyOrders /> }}
      scroll={{ x: 640 }}
      pagination={{ current: page, pageSize: PAGE_SIZE, total: data?.meta.total, onChange: setPage }}
      columns={[
        { title: 'Gói tập', render: (_, o) => <Link to={`/member/orders/${o.id}`}>{o.package.name}</Link> },
        { title: 'Thời hạn', render: (_, o) => `${formatDate(o.startsOn)} – ${formatDate(o.endsOn)}` },
        { title: 'Tổng tiền', align: 'right', render: (_, o) => formatVND(o.total) },
        { title: 'Trạng thái', render: (_, o) => <StatusTag kind="order" value={o.status} /> },
        { title: 'Tạo lúc', render: (_, o) => formatDateTime(o.createdAt) },
      ]}
    />
  );
};

const PaymentsTab = () => {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = usePayments({ page, pageSize: PAGE_SIZE });
  if (isError) return <PageError error={error} onRetry={() => void refetch()} />;
  return (
    <Table<Payment>
      rowKey="id"
      loading={isPending}
      dataSource={data?.data}
      locale={{ emptyText: isPending ? ' ' : 'Chưa có giao dịch nào' }}
      scroll={{ x: 640 }}
      pagination={{ current: page, pageSize: PAGE_SIZE, total: data?.meta.total, onChange: setPage }}
      columns={[
        { title: 'Mã giao dịch', dataIndex: 'merchantRef' },
        { title: 'Phương thức', render: (_, p) => METHOD_LABEL[p.method] },
        { title: 'Số tiền', align: 'right', render: (_, p) => formatVND(p.amount) },
        { title: 'Trạng thái', render: (_, p) => <StatusTag kind="payment" value={p.status} /> },
        { title: 'Thời gian', render: (_, p) => formatDateTime(p.paidAt ?? p.createdAt) },
        { title: 'Đơn', render: (_, p) => <Link to={`/member/orders/${p.orderId}`}>Xem đơn</Link> },
      ]}
    />
  );
};

/** UC14 Đơn và thanh toán của tôi (`/member/orders`). */
export const OrdersPage = () => (
  <div>
    <Typography.Title level={2} style={{ marginTop: 0 }}>
      Đơn và thanh toán
    </Typography.Title>
    <Card>
      <Tabs
        items={[
          { key: 'orders', label: 'Đơn hàng', children: <OrdersTab /> },
          { key: 'payments', label: 'Giao dịch', children: <PaymentsTab /> },
        ]}
      />
    </Card>
  </div>
);
