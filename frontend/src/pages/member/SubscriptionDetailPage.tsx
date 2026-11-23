import { Card, Col, Descriptions, Row, Skeleton, Space, Table, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { PageError } from '../../app/feedback/PageError';
import { StatusTag } from '../../app/feedback/StatusTag';
import { useSubscription } from '../../features/subscriptions/api';
import { formatDate, formatSessionsLeft } from '../../lib/format';
import { space } from '../../theme/tokens';

/** UC10 Chi tiết gói của tôi (`/member/subscriptions/:id`): số buổi theo tháng, bảo lưu. Bảo lưu làm tại quầy. */
export const SubscriptionDetailPage = () => {
  const { id = '' } = useParams();
  const { data: sub, isPending, isError, error, refetch } = useSubscription(id);

  if (isPending)
    return (
      <Card aria-busy="true">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  if (isError) return <PageError error={error} onRetry={() => void refetch()} />;

  return (
    <div>
      <Space align="center" style={{ marginBottom: space.md }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {sub.packageName}
        </Typography.Title>
        <StatusTag kind="subscription" value={sub.status} />
      </Space>
      <Row gutter={[space.lg, space.lg]}>
        <Col xs={24} lg={16}>
          <Card title="Số buổi theo tháng">
            {sub.sessions ? (
              <Table
                rowKey="month"
                size="small"
                pagination={false}
                dataSource={sub.monthlySessions}
                locale={{ emptyText: 'Chưa có buổi tập nào' }}
                columns={[
                  {
                    title: 'Tháng',
                    dataIndex: 'month',
                    render: (m: string) => `${m.slice(5)}/${m.slice(0, 4)}`,
                  },
                  { title: 'Đã tập', dataIndex: 'completed', align: 'right' },
                  { title: 'Vắng', dataIndex: 'noShow', align: 'right' },
                  { title: 'Sắp tới', dataIndex: 'upcoming', align: 'right' },
                ]}
              />
            ) : (
              <Typography.Text type="secondary">Gói Gym không tính buổi PT.</Typography.Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Thông tin gói" style={{ marginBottom: space.lg }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Thời hạn">
                {formatDate(sub.startsOn)} – {formatDate(sub.endsOn)}
              </Descriptions.Item>
              {sub.status === 'ACTIVE' && (
                <Descriptions.Item label="Còn lại">{sub.daysLeft} ngày</Descriptions.Item>
              )}
              {sub.sessions && (
                <Descriptions.Item label="Buổi PT">
                  <b>{formatSessionsLeft(sub.sessions.remaining, sub.sessions.total)}</b>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Vào lớp học">{sub.includesClass ? 'Có' : 'Không'}</Descriptions.Item>
              <Descriptions.Item label="Đơn">
                <Link to={`/member/orders/${sub.orderId}`}>Xem đơn và biên lai</Link>
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Bảo lưu">
            {sub.freeze ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Từ ngày">{formatDate(sub.freeze.frozenFrom)}</Descriptions.Item>
                <Descriptions.Item label="Đến hết">{formatDate(sub.freeze.frozenUntil)}</Descriptions.Item>
                <Descriptions.Item label="Số ngày">{sub.freeze.frozenDays}</Descriptions.Item>
                <Descriptions.Item label="Lý do">{sub.freeze.reason}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Typography.Text type="secondary">
                Chưa bảo lưu. Mỗi gói bảo lưu tối đa 1 lần, 30 ngày; liên hệ quầy để bảo lưu.
              </Typography.Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
