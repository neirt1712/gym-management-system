import { App, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { ApiErrorAlert } from '../../../app/feedback/ApiErrorAlert';
import { useAuth } from '../../auth';
import { PASSWORD_RULES } from '../../auth/rules';
import { getFieldErrors } from '../../../lib/errors';

type Values = { currentPassword: string; newPassword: string; confirmPassword: string };

const FIELDS = ['currentPassword', 'newPassword'] as const;

/**
 * UC06 Đổi mật khẩu. Sai mật khẩu hiện tại: BE trả 400 VALIDATION_ERROR gắn vào ô `currentPassword`.
 * Thành công: thiết bị khác bị đăng xuất, thiết bị này nhận phiên mới nên vẫn ở lại trang.
 */
export const ChangePasswordForm = () => {
  const [form] = Form.useForm<Values>();
  const { changePassword } = useAuth();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const onFinish = async ({ currentPassword, newPassword }: Values) => {
    setSubmitting(true);
    setError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      form.resetFields();
      message.success('Đã đổi mật khẩu');
    } catch (err) {
      const fieldErrors = getFieldErrors(err, FIELDS);
      form.setFields(fieldErrors);
      // Lỗi đã gắn vào ô thì không lặp lại ở đầu form.
      if (fieldErrors.length === 0) setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form<Values>
      form={form}
      name="change-password"
      layout="vertical"
      requiredMark={false}
      onFinish={onFinish}
    >
      {error !== null && <ApiErrorAlert error={error} />}
      <Form.Item
        label="Mật khẩu hiện tại"
        name="currentPassword"
        rules={[{ required: true, message: 'Nhập mật khẩu hiện tại.' }]}
      >
        <Input.Password autoComplete="current-password" />
      </Form.Item>
      <Form.Item
        label="Mật khẩu mới"
        name="newPassword"
        dependencies={['currentPassword']}
        rules={[
          ...PASSWORD_RULES,
          ({ getFieldValue }) => ({
            validator: (_, value) =>
              !value || value !== getFieldValue('currentPassword')
                ? Promise.resolve()
                : Promise.reject(new Error('Mật khẩu mới phải khác mật khẩu hiện tại.')),
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        label="Nhập lại mật khẩu mới"
        name="confirmPassword"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: 'Nhập lại mật khẩu mới.' },
          ({ getFieldValue }) => ({
            validator: (_, value) =>
              !value || value === getFieldValue('newPassword')
                ? Promise.resolve()
                : Promise.reject(new Error('Hai mật khẩu chưa khớp.')),
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Button htmlType="submit" loading={submitting}>
        Đổi mật khẩu
      </Button>
    </Form>
  );
};
