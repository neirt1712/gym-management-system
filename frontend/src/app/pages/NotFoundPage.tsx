import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="Không tìm thấy trang"
      subTitle="Đường dẫn không đúng hoặc trang đã được chuyển."
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      }
    />
  );
};
