import { Button, Layout, Space, Typography, theme } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { space } from '../../theme/tokens';
import { ROLE_HOME } from '../roles';

/** Khung cho trang công khai: trang chủ, gói tập, PT, đăng nhập, đăng ký. */
export const PublicLayout = () => {
  const { user } = useAuth();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingInline: space.lg,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Link to="/">
          <Typography.Title level={4} style={{ margin: 0, color: token.colorPrimary }}>
            Phòng gym
          </Typography.Title>
        </Link>
        <Space size={space.md}>
          <Link to="/packages">Gói tập</Link>
          <Link to="/trainers">Huấn luyện viên</Link>
          {user ? (
            <Button onClick={() => navigate(ROLE_HOME[user.role])}>Vào trang của tôi</Button>
          ) : (
            pathname !== '/login' && <Button onClick={() => navigate('/login')}>Đăng nhập</Button>
          )}
        </Space>
      </Layout.Header>
      <Layout.Content style={{ padding: space.lg }}>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
};
