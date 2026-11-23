import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ROLE_HOME } from '../../app/roles';
import { safeNext } from '../../app/safeNext';
import { isFakeAuth, useAuth, type LoginInput } from '../../features/auth';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../features/auth/fakeAuthApi';
import { PHONE_RULES } from '../../features/auth/rules';
import { getErrorCode, getErrorDetails, getErrorMessage, getRequestId } from '../../lib/errors';
import { space } from '../../theme/tokens';

const ROLE_SHORT = { ADMIN: 'Quản trị', STAFF: 'Quầy', TRAINER: 'PT', MEMBER: 'Hội viên' } as const;

/** Tài khoản mẫu hiện trong chế độ thử (bỏ tài khoản bị khóa). */
const DEMO_HINT = DEMO_ACCOUNTS.filter((a) => !a.locked)
  .map((a) => `${ROLE_SHORT[a.role]} ${a.phone}`)
  .join(' · ');

/** Đếm ngược số giây còn khóa tạm (`details.retryAfterSeconds` của ACCOUNT_TEMPORARILY_LOCKED). */
const useLockCountdown = (error: unknown) => {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (getErrorCode(error) !== 'ACCOUNT_TEMPORARILY_LOCKED') return setLeft(0);
    const seconds = getErrorDetails<{ retryAfterSeconds?: number }>(error)?.retryAfterSeconds ?? 0;
    const until = Date.now() + seconds * 1000;
    const tick = () => setLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [error]);
  return left;
};

const mmss = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

/** UC02 Đăng nhập (chỉ bằng số điện thoại, Q12). Sai 5 lần thì khóa tạm, nút bị khóa tới khi hết giờ chờ. */
export const LoginPage = () => {
  const { status, user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const next = safeNext(params.get('next'));
  const lockLeft = useLockCountdown(error);

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
              lockLeft > 0 ? (
                <span>
                  Thử lại sau <b>{mmss(lockLeft)}</b>.
                </span>
              ) : requestId ? (
                <Typography.Text type="secondary">Mã yêu cầu: {requestId}</Typography.Text>
              ) : undefined
            }
          />
        )}

        <Form<LoginInput> name="login" layout="vertical" requiredMark={false} onFinish={onFinish}>
          <Form.Item label="Số điện thoại" name="phone" rules={PHONE_RULES}>
            <Input autoComplete="username" inputMode="tel" autoFocus />
          </Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Nhập mật khẩu.' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting} disabled={lockLeft > 0}>
            {lockLeft > 0 ? 'Đang khóa tạm' : 'Đăng nhập'}
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
