import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import type { Role } from '../roles';

/**
 * Chặn route theo vai trò. Sai vai trò thì về trang 403.
 * Quyền trên từng nút trong màn hình đi theo allowedActions của BE, không xử lý ở đây.
 */
export const RequireRole = ({ roles }: { roles: Role[] }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/403" replace />;
  return <Outlet />;
};
