import { Card, Progress, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { StatusTag } from '../../../app/feedback/StatusTag';
import { formatDate, formatSessionsLeft } from '../../../lib/format';
import { space } from '../../../theme/tokens';
import type { Subscription } from '../api';

/** UC10 Một gói của tôi: thời hạn, số ngày còn lại (BE tính), số buổi PT (BE tính, không lưu cột). */
export const SubscriptionCard = ({ sub }: { sub: Subscription }) => (
  <Card
    title={sub.packageName}
    extra={<StatusTag kind="subscription" value={sub.status} />}
    actions={[
      <Link key="detail" to={`/member/subscriptions/${sub.id}`}>
        Xem chi tiết
      </Link>,
    ]}
  >
    <Space direction="vertical" size={space.sm} style={{ width: '100%' }}>
      <Typography.Text>
        {formatDate(sub.startsOn)} – {formatDate(sub.endsOn)}
        {sub.status === 'ACTIVE' && (
          <Typography.Text type="secondary"> · còn {sub.daysLeft} ngày</Typography.Text>
        )}
      </Typography.Text>
      {sub.freeze && (
        <Typography.Text type="secondary">
          Bảo lưu {sub.freeze.frozenDays} ngày, tới hết {formatDate(sub.freeze.frozenUntil)}
        </Typography.Text>
      )}
      {sub.sessions && (
        <div>
          <Typography.Text>
            <b>{formatSessionsLeft(sub.sessions.remaining, sub.sessions.total)}</b>
          </Typography.Text>
          <Progress
            percent={sub.sessions.total ? Math.round((sub.sessions.used / sub.sessions.total) * 100) : 0}
            showInfo={false}
            aria-label={`Đã tập ${sub.sessions.used}/${sub.sessions.total} buổi`}
          />
          <Typography.Text type="secondary">
            Đã tập {sub.sessions.used} · Đang giữ {sub.sessions.held} · Có thể đặt {sub.sessions.bookable}
          </Typography.Text>
        </div>
      )}
    </Space>
  </Card>
);
