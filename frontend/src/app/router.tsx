import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { MemberHomePage } from '../pages/member/MemberHomePage';
import { OrderDetailPage } from '../pages/member/OrderDetailPage';
import { OrdersPage } from '../pages/member/OrdersPage';
import { ProfilePage } from '../pages/member/ProfilePage';
import { PurchasePage } from '../pages/member/PurchasePage';
import { SubscriptionDetailPage } from '../pages/member/SubscriptionDetailPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { RequireAuth } from './guards/RequireAuth';
import { RequireRole } from './guards/RequireRole';
import { AppLayout } from './layouts/AppLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { NAV_BY_ROLE } from './navigation';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import type { Role } from './roles';

/**
 * Bản đồ route: docs/design/fe-architecture.md.
 * Làm xong màn nào thì thay PlaceholderPage của route đó bằng màn thật (route chi tiết :id thêm khi làm màn).
 */
const placeholder = (path: string, title: string, uc: string, owner: string): RouteObject => ({
  path,
  element: <PlaceholderPage title={title} uc={uc} owner={owner} />,
});

/** Màn đã làm xong, thay trang tạm cùng đường dẫn; route chi tiết (:id) không có trong menu. */
const READY: Record<string, RouteObject['element']> = {
  '/member': <MemberHomePage />,
  '/member/orders': <OrdersPage />,
};

const EXTRA_ROUTES: Partial<Record<Role, RouteObject[]>> = {
  MEMBER: [
    { path: '/member/purchase/:packageId', element: <PurchasePage /> },
    { path: '/member/orders/:id', element: <OrderDetailPage /> },
    { path: '/member/subscriptions/:id', element: <SubscriptionDetailPage /> },
  ],
};

const roleRoutes = (role: Role): RouteObject => ({
  element: <RequireRole roles={[role]} />,
  children: [
    ...NAV_BY_ROLE[role].map((i) =>
      READY[i.path] ? { path: i.path, element: READY[i.path] } : placeholder(i.path, i.label, i.uc, i.owner),
    ),
    ...(EXTRA_ROUTES[role] ?? []),
  ],
});

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      placeholder('/', 'Trang chủ', 'UC07', 'Bằng'),
      placeholder('/packages', 'Gói tập', 'UC07', 'Bằng'),
      placeholder('/trainers', 'Huấn luyện viên', 'UC21', 'Sơn'),
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      placeholder('/forgot-password', 'Quên mật khẩu', 'UC04', 'Sơn'),
      placeholder('/reset-password', 'Đặt lại mật khẩu', 'UC04', 'Sơn'),
      placeholder('/activate', 'Kích hoạt tài khoản', 'UC04', 'Sơn'),
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/me/profile', element: <ProfilePage /> },
          placeholder('/notifications', 'Thông báo', 'UC42', 'Bằng'),
          roleRoutes('MEMBER'),
          roleRoutes('TRAINER'),
          roleRoutes('STAFF'),
          roleRoutes('ADMIN'),
        ],
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
];

export const createAppRouter = () => createBrowserRouter(routes);
