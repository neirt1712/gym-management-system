import { Alert, App, Button, Card, Col, Descriptions, Row, Skeleton, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiErrorAlert } from '../../app/feedback/ApiErrorAlert';
import { PageError } from '../../app/feedback/PageError';
import { StatusTag } from '../../app/feedback/StatusTag';
import { useCancelOrder, useOrder } from '../../features/purchase/api';
import { PaymentMethodPicker } from '../../features/purchase/components/PaymentMethodPicker';
import { ReceiptView } from '../../features/purchase/components/ReceiptView';
import { formatDate, formatDateTime, formatVND } from '../../lib/format';
import { space } from '../../theme/tokens';

/** Chờ kết quả VNPay: hỏi lại mỗi 3 giây, tối đa 60 giây (fe-lead.md mục 6). */
const POLL_MS = 3000;
const POLL_LIMIT_MS = 60000;

/**
 * UC12, UC14 Đơn và kết quả thanh toán (`/member/orders/:id`), cũng là trang VNPay đưa người dùng quay về.
 * Không tin tham số trên return URL: chỉ đọc `GET /orders/{id}`.
 */
export const OrderDetailPage = () => {
  const { id = '' } = useParams();
  const { modal, message } = App.useApp();
  const [timedOut, setTimedOut] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const { data: order, isPending, isError, error, refetch } = useOrder(id, waiting && !timedOut && POLL_MS);
  const cancel = useCancelOrder();

  const vnpayPending =
    order?.status === 'PENDING' && order.payments.some((p) => p.method === 'VNPAY' && p.status === 'PENDING');
  useEffect(() => setWaiting(!!vnpayPending), [vnpayPending]);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), POLL_LIMIT_MS);
    return () => clearTimeout(timer);
  }, []);

  const confirmCancel = () =>
    modal.confirm({
      title: 'Hủy đơn này?',
      content: 'Đơn đã hủy không thanh toán được nữa. Muốn mua lại thì tạo đơn mới.',
      okText: 'Hủy đơn',
      okButtonProps: { danger: true },
      cancelText: 'Giữ đơn',
      onOk: () => cancel.mutateAsync(id).then(() => void message.success('Đã hủy đơn')),
    });

  if (isPending)
    return (
      <Card aria-busy="true">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  if (isError) return <PageError error={error} onRetry={() => void refetch()} />;

  const cashPending = order.payments.some((p) => p.method === 'CASH' && p.status === 'PENDING');

  return (
    <div>
      <Space className="no-print" align="center" style={{ marginBottom: space.md }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Đơn {order.package.name}
        </Typography.Title>
        <StatusTag kind="order" value={order.status} />
      </Space>
      <Row gutter={[space.lg, space.lg]}>
        <Col xs={24} lg={16}>
          <Card>
            {order.status === 'PAID' && order.receipt ? (
              <ReceiptView receipt={order.receipt} />
            ) : vnpayPending && !timedOut ? (
              <Alert
                type="info"
                showIcon
                message="Đang kiểm tra kết quả thanh toán VNPay"
                description="Trang tự cập nhật, bạn không cần tải lại."
              />
            ) : vnpayPending ? (
              // Quá 60 giây chưa có kết quả: cho kiểm tra lại, hoặc thanh toán lại (BE hủy lần trả cũ, openapi).
              <Space direction="vertical" size={space.md} style={{ width: '100%' }}>
                <Alert
                  type="warning"
                  showIcon
                  message="Chưa nhận được kết quả từ VNPay"
                  description="Nếu bạn đã trả tiền, gói sẽ có hiệu lực khi hệ thống nhận kết quả."
                  action={<Button onClick={() => void refetch()}>Kiểm tra lại</Button>}
                />
                <Typography.Text type="secondary">
                  Chưa trả tiền hoặc muốn đổi cách trả? Thanh toán lại, lần trả cũ sẽ bị hủy.
                </Typography.Text>
                <PaymentMethodPicker orderId={order.id} onCashCreated={() => void refetch()} />
              </Space>
            ) : order.status === 'PENDING' ? (
              <Space direction="vertical" size={space.md} style={{ width: '100%' }}>
                {cashPending && (
                  <Alert
                    type="info"
                    showIcon
                    message="Mang mã đơn ra quầy để trả tiền mặt trước khi hết hạn."
                  />
                )}
                <Typography.Text>
                  Hạn thanh toán: <b>{formatDateTime(order.expiresAt)}</b>
                </Typography.Text>
                <PaymentMethodPicker orderId={order.id} onCashCreated={() => void refetch()} />
              </Space>
            ) : (
              <Alert
                type="info"
                showIcon
                message={order.status === 'EXPIRED' ? 'Đơn đã quá hạn thanh toán' : 'Đơn đã hủy'}
                description={<Link to="/packages">Chọn gói để mua lại</Link>}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8} className="no-print">
          <Card title="Tóm tắt">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Gói tập">{order.package.name}</Descriptions.Item>
              <Descriptions.Item label="Thời hạn">
                {formatDate(order.startsOn)} – {formatDate(order.endsOn)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">{formatVND(order.total)}</Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">{formatDateTime(order.createdAt)}</Descriptions.Item>
            </Descriptions>
            {cancel.isError && <ApiErrorAlert error={cancel.error} />}
            {order.status === 'PENDING' && !(vnpayPending && !timedOut) && (
              <Button danger onClick={confirmCancel}>
                Hủy đơn
              </Button>
            )}
            {order.subscriptionId && <Link to="/member">Xem gói của tôi</Link>}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
