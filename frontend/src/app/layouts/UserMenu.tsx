import { BellOutlined, DownOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space, Typography, type MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { ROLE_LABEL } from '../roles';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const items: MenuProps['items'] = [
    { key: '/me/profile', icon: <UserOutlined />, label: 'Hồ sơ của tôi' },
    { key: '/notifications', icon: <BellOutlined />, label: 'Thông báo' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất' },
  ];

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      void logout().then(() => navigate('/login', { replace: true }));
      return;
    }
    navigate(key);
  };

  return (
    <Dropdown menu={{ items, onClick }} trigger={['click']} placement="bottomRight">
      <Button type="text">
        <Space>
          <span>{user.fullName}</span>
          <Typography.Text type="secondary">{ROLE_LABEL[user.role]}</Typography.Text>
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  );
};
