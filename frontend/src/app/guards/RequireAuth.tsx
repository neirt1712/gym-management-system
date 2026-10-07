import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { PageSkeleton } from '../pages/PageSkeleton';

/** Chưa đăng nhập thì về /login?next=<trang đang mở>. */
export const RequireAuth = () => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageSkeleton />;
  if (status === 'anonymous') {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
};
