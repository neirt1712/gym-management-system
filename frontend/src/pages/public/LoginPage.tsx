import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ROLE_HOME } from '../../app/roles';
import { safeNext } from '../../app/safeNext';
import { isFakeAuth, useAuth, type LoginInput } from '../../features/auth';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../features/auth/fakeAuthApi';
import { getErrorMessage, getRequestId } from '../../lib/errors';
import { space } from '../../theme/tokens';

/** Khớp schema `Phone` trong docs/api/openapi.yaml. */
const PHONE_PATTERN = /^0[0-9]{9}$/;

const ROLE_SHORT = { ADMIN: 'Quản trị', STAFF: 'Quầy', TRAINER: 'PT', MEMBER: 'Hội viên' } as const;

/** Tài khoản mẫu hiện trong chế độ thử (bỏ tài khoản bị khóa). */
const DEMO_HINT = DEMO_ACCOUNTS.filter((a) => !a.locked)
  .map((a) => `${ROLE_SHORT[a.role]} ${a.phone}`)
  .join(' · ');

/** UC02 Đăng nhập (chỉ bằng số điện thoại, Q12). */
export const LoginPage = () => {
  const { status, user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const next = safeNext(params.get('next'));

  if (status === 'authenticated' && user) return <Navigate to={next ?? ROLE_HOME[user.role]} replace />;

  const onFinish = async (values: LoginInput) => {
    setSubmitting(true);
    setError(null);
    try {
      const signedIn = await login(values);
      navigate(next ?? ROLE_HOME[signedIn.role], { replace: true });
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  const requestId = error ? getRequestId(error) : undefined;

  return (
    <div style={{ maxWidth: 400, margin: `${space.xl}px auto` }}>
      <Card>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Đăng nhập
        </Typography.Title>

        {error !== null && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: space.md }}
            message={getErrorMessage(error)}
            description={
              requestId ? (
                <Typography.Text type="secondary">Mã yêu cầu: {requestId}</Typography.Text>
              ) : undefined
            }
          />
        )}

        <Form<LoginInput> name="login" layout="vertical" requiredMark={false} onFinish={onFinish}>
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: 'Nhập số điện thoại.' },
              { pattern: PHONE_PATTERN, message: 'Số điện thoại gồm 10 số, bắt đầu bằng 0.' },
            ]}
          >
            <Input autoComplete="username" inputMode="tel" autoFocus />
          </Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Nhập mật khẩu.' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Đăng nhập
          </Button>
        </Form>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: space.md }}>
          <Link to="/forgot-password">Quên mật khẩu</Link>
          <Link to="/register">Tạo tài khoản</Link>
        </div>

        {isFakeAuth && (
          <Alert
            type="info"
            style={{ marginTop: space.md }}
            message="Chế độ thử, chưa nối backend"
            description={`${DEMO_HINT} · Mật khẩu ${DEMO_PASSWORD}`}
          />
        )}
      </Card>
    </div>
  );
};
