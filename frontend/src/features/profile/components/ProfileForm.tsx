import { App, Button, DatePicker, Form, Input, InputNumber, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { ApiErrorAlert } from '../../../app/feedback/ApiErrorAlert';
import { useAuth } from '../../auth';
import { getFieldErrors } from '../../../lib/errors';
import { useUpdateMe, type Me, type UpdateMeInput } from '../api';

type Values = {
  fullName: string;
  email?: string | null;
  dob?: Dayjs | null;
  specialties?: string[];
  bio?: string | null;
  experienceYears?: number | null;
};

const FIELDS = ['fullName', 'email', 'dob'] as const;

/** UC05 Sửa hồ sơ. SĐT dùng để đăng nhập nên không sửa ở đây. PT sửa thêm chuyên môn, giới thiệu, kinh nghiệm. */
export const ProfileForm = ({ me }: { me: Me }) => {
  const [form] = Form.useForm<Values>();
  const update = useUpdateMe();
  const { updateUser } = useAuth();
  const { message } = App.useApp();
  const isTrainer = me.role === 'TRAINER' && me.trainer !== null;

  const onFinish = async (values: Values) => {
    const body: UpdateMeInput = {
      fullName: values.fullName.trim(),
      email: values.email?.trim() || null,
      dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
      ...(isTrainer && {
        trainer: {
          specialties: values.specialties ?? [],
          bio: values.bio?.trim() || null,
          experienceYears: values.experienceYears ?? null,
        },
      }),
    };
    try {
      const saved = await update.mutateAsync(body);
      updateUser({ fullName: saved.fullName, email: saved.email });
      message.success('Đã lưu');
    } catch (err) {
      form.setFields(getFieldErrors(err, FIELDS));
    }
  };

  return (
    <Form<Values>
      form={form}
      layout="vertical"
      requiredMark="optional"
      onFinish={onFinish}
      initialValues={{
        fullName: me.fullName,
        email: me.email,
        dob: me.dob ? dayjs(me.dob) : null,
        specialties: me.trainer?.specialties ?? [],
        bio: me.trainer?.bio ?? null,
        experienceYears: me.trainer?.experienceYears ?? null,
      }}
    >
      {update.isError && <ApiErrorAlert error={update.error} />}
      <Form.Item
        label="Họ và tên"
        name="fullName"
        rules={[
          { required: true, whitespace: true, message: 'Nhập họ và tên.' },
          { max: 100, message: 'Họ và tên tối đa 100 ký tự.' },
        ]}
      >
        <Input autoComplete="name" />
      </Form.Item>
      <Form.Item label="Số điện thoại" extra="Dùng để đăng nhập. Muốn đổi số, liên hệ quầy.">
        <Input value={me.phone} disabled />
      </Form.Item>
      <Form.Item
        label="Email"
        name="email"
        extra="Có email thì bạn tự lấy lại mật khẩu được."
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
      {isTrainer && (
        <>
          <Form.Item label="Chuyên môn" name="specialties" extra="Gõ rồi nhấn Enter để thêm.">
            <Select mode="tags" open={false} tokenSeparators={[',']} />
          </Form.Item>
          <Form.Item label="Kinh nghiệm (năm)" name="experienceYears">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Giới thiệu" name="bio">
            <Input.TextArea rows={4} />
          </Form.Item>
        </>
      )}
      <Button type="primary" htmlType="submit" loading={update.isPending}>
        Lưu thay đổi
      </Button>
    </Form>
  );
};
