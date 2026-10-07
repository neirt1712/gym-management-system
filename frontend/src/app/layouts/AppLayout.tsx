import { Layout, Menu, Typography, theme } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { space } from '../../theme/tokens';
import { activeNavPath, NAV_BY_ROLE } from '../navigation';
import { ROLE_HOME } from '../roles';
import { UserMenu } from './UserMenu';

/** Khung chung sau đăng nhập: menu trái theo vai trò, thanh trên có menu tài khoản. */
export const AppLayout = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { token } = theme.useToken();
  const items = user ? NAV_BY_ROLE[user.role] : [];
  const selected = activeNavPath(items, pathname);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider breakpoint="md" collapsedWidth={0} width={232} theme="light">
        <Link to={user ? ROLE_HOME[user.role] : '/'} style={{ display: 'block', padding: space.md }}>
          <Typography.Title level={4} style={{ margin: 0, color: token.colorPrimary }}>
            Phòng gym
          </Typography.Title>
        </Link>
        <Menu
          mode="inline"
          selectedKeys={selected ? [selected] : []}
          items={items.map((i) => ({ key: i.path, icon: i.icon, label: <Link to={i.path}>{i.label}</Link> }))}
          style={{ borderInlineEnd: 'none' }}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingInline: space.lg,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <UserMenu />
        </Layout.Header>
        <Layout.Content style={{ padding: space.lg }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
};
