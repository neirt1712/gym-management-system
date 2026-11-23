import { BellOutlined } from '@ant-design/icons';
import { Badge, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../features/notifications/api';

/** UC42 Chuông trên thanh trên cùng: số chưa đọc, bấm mở trang Thông báo. */
export const NotificationBell = () => {
  const navigate = useNavigate();
  // Chỉ cần meta.unreadCount nên lấy 1 dòng
  const { data } = useNotifications({ pageSize: 1 }, { poll: true });
  const unread = data?.meta.unreadCount ?? 0;

  return (
    <Badge count={unread} size="small" overflowCount={99}>
      <Button
        type="text"
        icon={<BellOutlined />}
        aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        onClick={() => navigate('/notifications')}
      />
    </Badge>
  );
};
