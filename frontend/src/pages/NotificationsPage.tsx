import { Badge, Button, Card, List, Segmented, Space, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, ErrorState, PageHeader } from '../components';
import { useAuth } from '../features/auth';
import { useMarkNotificationRead, useNotifications, type Notification } from '../features/notifications/api';
import { formatDateTime } from '../lib/format';
import { space } from '../theme/tokens';

type Filter = 'ALL' | 'UNREAD';

/** Màn liên quan để mở khi bấm thông báo, theo `targetType` (chỉ những màn đã có). */
const targetPath = (n: Notification, role: string | undefined): string | null => {
  if (!n.targetId) return null;
  if (n.targetType === 'ORDER' && role === 'MEMBER') return `/member/orders/${n.targetId}`;
  if (n.targetType === 'SUBSCRIPTION' && role === 'MEMBER') return `/member/subscriptions/${n.targetId}`;
  if (n.targetType === 'APPOINTMENT' && role === 'MEMBER') return `/member/appointments/${n.targetId}`;
  if (n.targetType === 'APPOINTMENT' && role === 'TRAINER') return `/trainer/appointments/${n.targetId}`;
  return null;
};

/** UC42 Thông báo (`/notifications`): lọc chưa đọc, bấm để đánh dấu đã đọc và mở màn liên quan. */
export const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [page, setPage] = useState(1);
  const markRead = useMarkNotificationRead();
  const { data, isPending, isError, error, refetch } = useNotifications({
    page,
    pageSize: 20,
    ...(filter === 'UNREAD' ? { isRead: false } : {}),
  });

  const open = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id);
    const path = targetPath(n, user?.role);
    if (path) navigate(path);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader
        title="Thông báo"
        description={data ? `${data.meta.unreadCount} thông báo chưa đọc` : undefined}
      />
      <Segmented<Filter>
        aria-label="Lọc thông báo"
        value={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        options={[
          { label: 'Tất cả', value: 'ALL' },
          { label: 'Chưa đọc', value: 'UNREAD' },
        ]}
        style={{ marginBottom: space.md }}
      />
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <Card>
          <List
            loading={isPending}
            dataSource={data?.data}
            locale={{ emptyText: <EmptyState description="Bạn chưa có thông báo nào" /> }}
            pagination={
              data && data.meta.totalPages > 1
                ? { current: page, pageSize: 20, total: data.meta.total, onChange: setPage }
                : false
            }
            renderItem={(n) => (
              <List.Item
                actions={[
                  !n.isRead && (
                    <Button key="read" type="link" onClick={() => markRead.mutate(n.id)}>
                      Đánh dấu đã đọc
                    </Button>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      {!n.isRead && <Badge status="processing" aria-label="Chưa đọc" />}
                      <Typography.Link strong={!n.isRead} onClick={() => open(n)}>
                        {n.title}
                      </Typography.Link>
                    </Space>
                  }
                  description={
                    <>
                      {n.body}
                      <Typography.Text type="secondary" style={{ display: 'block' }}>
                        {formatDateTime(n.createdAt)}
                      </Typography.Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};
