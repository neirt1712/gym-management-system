import { Card, Col, Descriptions, Row, Skeleton, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PageError } from '../../app/feedback/PageError';
import { usePackage } from '../../features/purchase/api';
import { PurchaseFlow } from '../../features/purchase/components/PurchaseFlow';
import { formatDuration, formatVND } from '../../lib/format';
import { space } from '../../theme/tokens';

/** UC09 Hội viên tự mua gói (`/member/purchase/:packageId`). Danh mục gói dẫn tới đây. */
export const PurchasePage = () => {
  const { packageId = '' } = useParams();
  const navigate = useNavigate();
  const { data: pkg, isPending, isError, error, refetch } = usePackage(packageId);

  return (
    <div>
      <Typography.Title level={2} style={{ marginTop: 0 }}>
        Mua gói
      </Typography.Title>
      {isPending ? (
        <Card aria-busy="true">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : isError ? (
        <PageError error={error} onRetry={() => void refetch()} />
      ) : (
        <Row gutter={[space.lg, space.lg]}>
          <Col xs={24} lg={16}>
            <Card>
              <PurchaseFlow pkg={pkg} onOpenOrder={(id) => navigate(`/member/orders/${id}`)} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title={pkg.name}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Giá">{formatVND(pkg.price)}</Descriptions.Item>
                <Descriptions.Item label="Thời hạn">
                  {formatDuration(pkg.durationValue, pkg.durationUnit)}
                </Descriptions.Item>
                {pkg.totalSessions !== null && (
                  <Descriptions.Item label="Số buổi PT">{pkg.totalSessions} buổi</Descriptions.Item>
                )}
              </Descriptions>
              {pkg.benefits.length > 0 && (
                <ul style={{ paddingInlineStart: space.md, marginBottom: 0 }}>
                  {pkg.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};
