import { Alert, Button, Card, DatePicker, Form, Input, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiErrorAlert } from '../../app/feedback/ApiErrorAlert';
import { ROLE_HOME } from '../../app/roles';
import { useAuth } from '../../features/auth';
import { getErrorCode, getErrorMessage, getFieldErrors } from '../../lib/errors';
import { space } from '../../theme/tokens';
import { PASSWORD_RULES, PHONE_RULES } from '../../features/auth/rules';

type Values = {
  fullName: string;
  phone: string;
  email?: string;
  dob?: Dayjs | null;
  password: string;
  confirmPassword: string;
};

const FIELDS = ['fullName', 'phone', 'email', 'dob', 'password'] as const;

/** UC01 Đăng ký tài khoản khách hàng. Email không bắt buộc (Q15). Đăng ký xong vào luôn. */
export const RegisterPage = () => {
  const { status, user, register } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm<Values>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (status === 'authenticated' && user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  const onFinish = async ({ fullName, phone, email, dob, password }: Values) => {
    setSubmitting(true);
    setError(null);
    try {
      const signedIn = await register({
        fullName: fullName.trim(),
        phone,
        email: email?.trim() || null,
        dob: dob ? dob.format('YYYY-MM-DD') : null,
        password,
      });
      navigate(ROLE_HOME[signedIn.role], { replace: true });
    } catch (err) {
      form.setFields(getFieldErrors(err, FIELDS));
      setError(err);
      setSubmitting(false);
    }
  };

  // SĐT đã có hồ sơ tạo tại quầy: không báo trùng mà hướng dẫn kích hoạt (brief màn 2).
  const needsActivation = getErrorCode(error) === 'ACTIVATION_REQUIRED';

  return (
    <div style={{ maxWidth: 440, margin: `${space.xl}px auto` }}>
      <Card>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Tạo tài khoản
        </Typography.Title>

        {error !== null &&
          (needsActivation ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: space.md }}
              message={getErrorMessage(error)}
              description="Có email thì dùng liên kết kích hoạt; không có email thì nhờ quầy đặt mật khẩu."
              action={<Link to="/activate">Kích hoạt</Link>}
            />
          ) : (
            <ApiErrorAlert error={error} />
          ))}

        <Form<Values>
          form={form}
          name="register"
          layout="vertical"
          requiredMark="optional"
          onFinish={onFinish}
        >
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[
              { required: true, whitespace: true, message: 'Nhập họ và tên.' },
              { max: 100, message: 'Họ và tên tối đa 100 ký tự.' },
            ]}
          >
            <Input autoComplete="name" autoFocus />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="phone" extra="Dùng để đăng nhập." rules={PHONE_RULES}>
            <Input autoComplete="tel" inputMode="tel" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            extra="Có email thì bạn tự lấy lại mật khẩu được. Không có thì ra quầy để được hỗ trợ."
            rules={[{ type: 'email', message: 'Email chưa đúng định dạng.' }]}
          >
            <Input autoComplete="email" inputMode="email" />
          </Form.Item>
          <Form.Item label="Ngày sinh" name="dob">
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="dd/mm/yyyy"
              style={{ width: '100%' }}
              disabledDate={(d) => d.isAfter(dayjs(), 'day')}
            />
          </Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={PASSWORD_RULES}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Nhập lại mật khẩu"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Nhập lại mật khẩu.' },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || value === getFieldValue('password')
                    ? Promise.resolve()
                    : Promise.reject(new Error('Hai mật khẩu chưa khớp.')),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Tạo tài khoản
          </Button>
        </Form>

        <Typography.Paragraph style={{ marginTop: space.md, marginBottom: 0, textAlign: 'center' }}>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
};
