import { Button, Card, Col, Descriptions, List, Row, Skeleton, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusTag } from '../../app/feedback/StatusTag';
import { EmptyState, ErrorState, PageHeader } from '../../components';
import { BuyForMemberDrawer } from '../../features/counter/components/BuyForMemberDrawer';
import { CashConfirmModal, type CashToCollect } from '../../features/counter/components/CashConfirmModal';
import { useMember } from '../../features/members/api';
import { useOrders, type Order } from '../../features/purchase/api';
import { formatDate, formatDateTime, formatSessionsLeft, formatVND } from '../../lib/format';
import { space } from '../../theme/tokens';

/** Thanh toán tiền mặt đang chờ thu của một đơn, nếu có. */
const pendingCashOf = (order: Order) =>
  order.status === 'PENDING'
    ? order.payments.find((p) => p.method === 'CASH' && p.status === 'PENDING')
    : undefined;

/**
 * UC19 Chi tiết hội viên (`/staff/members/:id`): gói hiện tại, đơn gần đây.
 * UC09 mua gói hộ (chỉ tiền mặt) và UC13 thu tiền ngay tại đây.
 * Chưa có: sửa hồ sơ, bảo lưu, đặt lại mật khẩu tại quầy, lịch sử ra vào.
 */
export const StaffMemberDetailPage = () => {
  const { id = '' } = useParams();
  const member = useMember(id);
  const orders = useOrders({ memberId: id, pageSize: 10 });
  const [buying, setBuying] = useState(false);
  const [collecting, setCollecting] = useState<CashToCollect | null>(null);

  const collect = (order: Order) => {
    const payment = pendingCashOf(order);
    if (!payment || !member.data) return;
    setCollecting({
      paymentId: payment.id,
      amount: payment.amount,
      memberName: member.data.fullName,
      description: order.package.name,
    });
  };

  // Đơn vừa tạo ở ngăn mua hộ đã chọn tiền mặt: mở luôn hộp thu tiền khi danh sách đơn tải lại
  const openOrderAfterBuy = async (orderId: string) => {
    const { data } = await orders.refetch();
    const order = data?.data.find((o) => o.id === orderId);
    if (order) collect(order);
  };

  if (member.isPending) {
    return (
      <Card aria-busy="true">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }
  if (member.isError) return <ErrorState error={member.error} onRetry={() => void member.refetch()} />;
  const m = member.data;

  return (
    <div>
      <Typography.Text type="secondary">
        <Link to="/staff/members">Hội viên</Link> / {m.fullName}
      </Typography.Text>
      <PageHeader
        title={m.fullName}
        description={`${m.memberCode} · ${m.phone} · ${m.email ?? 'chưa có email'} · ${
          m.accountActivated ? 'tài khoản đã kích hoạt' : 'chưa kích hoạt tài khoản'
        }`}
        extra={
          <Button type="primary" onClick={() => setBuying(true)}>
            Mua gói hộ
          </Button>
        }
      />

      <Row gutter={[space.lg, space.lg]}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size={space.lg} style={{ width: '100%' }}>
            <Card title="Gói hiện tại">
              {m.subscriptions.length === 0 ? (
                <EmptyState
                  description="Chưa có gói đang hiệu lực"
                  action={<Button onClick={() => setBuying(true)}>Mua gói cho hội viên</Button>}
                />
              ) : (
                <List
                  dataSource={m.subscriptions}
                  renderItem={(s) => (
                    <List.Item extra={<StatusTag kind="subscription" value={s.status} />}>
                      <List.Item.Meta
                        title={s.packageName}
                        description={
                          <>
                            {formatDate(s.startsOn)} – {formatDate(s.endsOn)}
                            {s.sessions && ` · ${formatSessionsLeft(s.sessions.remaining, s.sessions.total)}`}
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>

            <Card title="Đơn gần đây">
              {orders.isError ? (
                <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
              ) : (
                <List
                  loading={orders.isPending}
                  dataSource={orders.data?.data}
                  locale={{ emptyText: <EmptyState description="Hội viên chưa có đơn nào" /> }}
                  renderItem={(o) => (
                    <List.Item
                      actions={[
                        pendingCashOf(o) && (
                          <Button key="collect" onClick={() => collect(o)}>
                            Thu tiền
                          </Button>
                        ),
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        title={
                          <Space wrap>
                            {o.package.name}
                            <StatusTag kind="order" value={o.status} />
                          </Space>
                        }
                        description={`${formatVND(o.total)} · tạo ${formatDateTime(o.createdAt)}${
                          o.receiptNo ? ` · biên lai ${o.receiptNo}` : ''
                        }`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Hồ sơ">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Họ tên">{m.fullName}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{m.phone}</Descriptions.Item>
              <Descriptions.Item label="Email">{m.email ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">{m.dob ? formatDate(m.dob) : '—'}</Descriptions.Item>
              <Descriptions.Item label="Tham gia">{formatDate(m.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Trong phòng">
                {m.currentCheckIn ? (
                  <Tag color="success">Từ {formatDateTime(m.currentCheckIn.checkedInAt)}</Tag>
                ) : (
                  'Không'
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <BuyForMemberDrawer
        open={buying}
        memberId={m.id}
        memberName={m.fullName}
        onClose={() => setBuying(false)}
        onOrderReady={(orderId) => void openOrderAfterBuy(orderId)}
      />
      <CashConfirmModal target={collecting} onClose={() => setCollecting(null)} />
    </div>
  );
};
