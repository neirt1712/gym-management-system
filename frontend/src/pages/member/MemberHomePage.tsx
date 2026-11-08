import { Button, Card, Col, Empty, Row, Skeleton, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PageError } from '../../app/feedback/PageError';
import { useAuth } from '../../features/auth';
import { QrCard } from '../../features/profile/components/QrCard';
import { useSubscriptions } from '../../features/subscriptions/api';
import { SubscriptionCard } from '../../features/subscriptions/components/SubscriptionCard';
import { space } from '../../theme/tokens';

/** UC10, UC15 Tổng quan hội viên (`/member`): gói đang có, mã QR check-in. */
export const MemberHomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isPending, isError, error, refetch } = useSubscriptions({ status: ['ACTIVE', 'FROZEN'] });
  const subs = data?.data ?? [];

  return (
    <div>
      <Typography.Title level={2} style={{ marginTop: 0 }}>
        Tổng quan
      </Typography.Title>
      <Typography.Paragraph type="secondary">Xin chào, {user?.fullName}.</Typography.Paragraph>
      <Row gutter={[space.lg, space.lg]}>
        <Col xs={24} lg={16}>
          <Typography.Title level={4}>Gói của tôi</Typography.Title>
          {isPending ? (
            <Card aria-busy="true">
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          ) : isError ? (
            <PageError error={error} onRetry={() => void refetch()} />
          ) : subs.length === 0 ? (
            <Card>
              <Empty description="Bạn chưa có gói nào đang hiệu lực">
                <Button type="primary" onClick={() => navigate('/packages')}>
                  Xem gói tập
                </Button>
              </Empty>
            </Card>
          ) : (
            <Space direction="vertical" size={space.md} style={{ width: '100%' }}>
              {subs.map((s) => (
                <SubscriptionCard key={s.id} sub={s} />
              ))}
            </Space>
          )}
        </Col>
        <Col xs={24} lg={8}>
          <QrCard />
        </Col>
      </Row>
    </div>
  );
};
