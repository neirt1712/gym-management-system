import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { ROLE_HOME } from '../roles';

export const ForbiddenPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="Bạn không có quyền xem trang này"
      subTitle="Trang này dành cho vai trò khác. Quay về trang chính của bạn."
      extra={
        <Button type="primary" onClick={() => navigate(user ? ROLE_HOME[user.role] : '/')}>
          Về trang chính
        </Button>
      }
    />
  );
};
