import { App, Button, Card, Form, Input, Modal, Radio, Select, Space, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useState } from 'react';
import { ApiErrorAlert } from '../../app/feedback/ApiErrorAlert';
import { StatusTag } from '../../app/feedback/StatusTag';
import { ROLE_LABEL, type Role } from '../../app/roles';
import { DataTable, EmptyState, ErrorState, PageHeader } from '../../components';
import {
  useCreateUser,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUsers,
  type User,
  type UserListQuery,
} from '../../features/users/api';
import { formatDate } from '../../lib/format';
import { space } from '../../theme/tokens';

const PAGE_SIZE = 20;

type NewUser = {
  role: 'STAFF' | 'TRAINER';
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  shift?: string;
  specialties?: string;
  experienceYears?: string;
};

/** UC32 Tạo tài khoản Staff hoặc PT. */
const CreateUserModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<NewUser>();
  const role = Form.useWatch('role', form);
  const create = useCreateUser();

  const close = () => {
    form.resetFields();
    create.reset();
    onClose();
  };

  const submit = (v: NewUser) =>
    create.mutate(
      {
        role: v.role,
        fullName: v.fullName.trim(),
        phone: v.phone.trim(),
        email: v.email?.trim() || null,
        password: v.password,
        ...(v.role === 'STAFF' ? { shift: v.shift?.trim() || null } : {}),
        ...(v.role === 'TRAINER'
          ? {
              trainer: {
                specialties: (v.specialties ?? '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
                experienceYears: v.experienceYears ? Number(v.experienceYears) : null,
              },
            }
          : {}),
      },
      {
        onSuccess: () => {
          void message.success('Đã tạo tài khoản');
          close();
        },
      },
    );

  return (
    <Modal
      open={open}
      title="Tạo tài khoản"
      okText="Tạo tài khoản"
      cancelText="Đóng"
      okButtonProps={{ loading: create.isPending, htmlType: 'submit', form: 'create-user' }}
      onCancel={close}
      destroyOnClose
    >
      {create.isError && <ApiErrorAlert error={create.error} />}
      <Form
        id="create-user"
        form={form}
        layout="vertical"
        initialValues={{ role: 'STAFF' }}
        onFinish={submit}
        requiredMark="optional"
      >
        <Form.Item name="role" label="Vai trò">
          <Radio.Group>
            <Radio value="STAFF">Nhân viên quầy</Radio>
            <Radio value="TRAINER">Huấn luyện viên (PT)</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="fullName"
          label="Họ tên"
          rules={[{ required: true, whitespace: true, message: 'Nhập họ tên' }]}
        >
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { required: true, message: 'Nhập số điện thoại' },
            { pattern: /^0\d{9}$/, message: 'Số điện thoại gồm 10 số, bắt đầu bằng 0' },
          ]}
        >
          <Input inputMode="tel" maxLength={10} />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
          <Input maxLength={255} />
        </Form.Item>
        <Form.Item
          name="password"
          label="Mật khẩu ban đầu"
          rules={[
            { required: true, message: 'Nhập mật khẩu' },
            { min: 8, max: 72, message: 'Mật khẩu từ 8 đến 72 ký tự' },
          ]}
        >
          <Input.Password />
        </Form.Item>
        {role === 'STAFF' && (
          <Form.Item name="shift" label="Ca làm">
            <Input maxLength={50} placeholder="Ví dụ: Ca sáng" />
          </Form.Item>
        )}
        {role === 'TRAINER' && (
          <>
            <Form.Item
              name="specialties"
              label="Chuyên môn"
              extra="Cách nhau bằng dấu phẩy, ví dụ: Tăng cơ, Yoga"
            >
              <Input />
            </Form.Item>
            <Form.Item name="experienceYears" label="Số năm kinh nghiệm">
              <Input inputMode="numeric" maxLength={2} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

type ReasonDialog = { user: User; kind: 'STATUS' | 'ROLE' } | null;

/** UC34, UC35 Khóa/mở hoặc đổi vai trò, bắt buộc lý do (ghi nhật ký). */
const ReasonModal = ({ dialog, onClose }: { dialog: ReasonDialog; onClose: () => void }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ reason: string; role?: 'ADMIN' | 'STAFF' | 'TRAINER' }>();
  const status = useUpdateUserStatus();
  const role = useUpdateUserRole();
  const pending = status.isPending || role.isPending;
  const error = status.error ?? role.error;
  const locking = dialog?.kind === 'STATUS' && dialog.user.status === 'ACTIVE';

  const close = () => {
    form.resetFields();
    status.reset();
    role.reset();
    onClose();
  };

  const submit = ({ reason, role: newRole }: { reason: string; role?: 'ADMIN' | 'STAFF' | 'TRAINER' }) => {
    if (!dialog) return;
    const done = (text: string) => () => {
      void message.success(text);
      close();
    };
    if (dialog.kind === 'STATUS') {
      status.mutate(
        { id: dialog.user.id, body: { status: locking ? 'LOCKED' : 'ACTIVE', reason: reason.trim() } },
        { onSuccess: done(locking ? 'Đã khóa tài khoản' : 'Đã mở khóa') },
      );
    } else if (newRole) {
      role.mutate(
        { id: dialog.user.id, body: { role: newRole, reason: reason.trim() } },
        { onSuccess: done('Đã đổi vai trò') },
      );
    }
  };

  return (
    <Modal
      open={!!dialog}
      title={
        dialog?.kind === 'ROLE'
          ? `Đổi vai trò của ${dialog.user.fullName}?`
          : locking
            ? `Khóa tài khoản ${dialog?.user.fullName}?`
            : `Mở khóa tài khoản ${dialog?.user.fullName}?`
      }
      okText={dialog?.kind === 'ROLE' ? 'Đổi vai trò' : locking ? 'Khóa tài khoản' : 'Mở khóa'}
      okButtonProps={{ danger: locking, loading: pending, htmlType: 'submit', form: 'user-reason' }}
      cancelText="Đóng"
      onCancel={close}
      destroyOnClose
    >
      {locking && <p>Người này bị đăng xuất khỏi mọi thiết bị ngay.</p>}
      {error && <ApiErrorAlert error={error} />}
      <Form id="user-reason" form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        {dialog?.kind === 'ROLE' && (
          <Form.Item name="role" label="Vai trò mới" rules={[{ required: true, message: 'Chọn vai trò' }]}>
            <Select
              options={(['ADMIN', 'STAFF', 'TRAINER'] as const)
                .filter((r) => r !== dialog.user.role)
                .map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
            />
          </Form.Item>
        )}
        <Form.Item
          name="reason"
          label="Lý do"
          rules={[{ required: true, whitespace: true, message: 'Nhập lý do' }]}
        >
          <Input.TextArea maxLength={500} autoSize={{ minRows: 2 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/** UC31–UC35 Tài khoản (`/admin/users`): tìm, lọc, tạo Staff/PT, khóa/mở, đổi vai trò. */
export const AdminUsersPage = () => {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [dialog, setDialog] = useState<ReasonDialog>(null);
  const params: UserListQuery = {
    page,
    pageSize: PAGE_SIZE,
    ...(q ? { q } : {}),
    ...(role !== 'ALL' ? { role } : {}),
  };
  const { data, isPending, isFetching, isError, error, refetch } = useUsers(params);

  const columns: TableColumnsType<User> = [
    { title: 'Họ tên', dataIndex: 'fullName' },
    { title: 'Số điện thoại', dataIndex: 'phone' },
    { title: 'Vai trò', render: (_, u) => <Tag>{ROLE_LABEL[u.role]}</Tag> },
    { title: 'Trạng thái', render: (_, u) => <StatusTag kind="account" value={u.status} /> },
    { title: 'Tạo ngày', render: (_, u) => formatDate(u.createdAt) },
    {
      title: 'Thao tác',
      render: (_, u) => (
        <Space>
          <Button danger={u.status === 'ACTIVE'} onClick={() => setDialog({ user: u, kind: 'STATUS' })}>
            {u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
          </Button>
          {u.role !== 'MEMBER' && (
            <Button onClick={() => setDialog({ user: u, kind: 'ROLE' })}>Đổi vai trò</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tài khoản"
        description="Tạo tài khoản Staff, PT; khóa, mở hoặc đổi vai trò kèm lý do."
        extra={
          <Button type="primary" onClick={() => setCreating(true)}>
            Tạo tài khoản
          </Button>
        }
      />
      <Space
        wrap
        size={space.md}
        style={{ marginBottom: space.md, width: '100%', justifyContent: 'space-between' }}
      >
        <Space wrap size={space.md}>
          <Input.Search
            aria-label="Tìm tài khoản"
            placeholder="Tên hoặc số điện thoại"
            allowClear
            onSearch={(v) => {
              setQ(v.trim());
              setPage(1);
            }}
            style={{ width: 280 }}
          />
          <Select<Role | 'ALL'>
            aria-label="Vai trò"
            value={role}
            onChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            style={{ width: 200 }}
            options={[
              { value: 'ALL', label: 'Mọi vai trò' },
              ...(['ADMIN', 'STAFF', 'TRAINER', 'MEMBER'] as const).map((r) => ({
                value: r,
                label: ROLE_LABEL[r],
              })),
            ]}
          />
        </Space>
        <Button
          onClick={() => {
            setQ('');
            setRole('ALL');
            setPage(1);
          }}
        >
          Đặt lại
        </Button>
      </Space>
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <Card>
          <DataTable<User>
            columns={columns}
            rows={data?.data}
            rowKey="id"
            loading={isPending || isFetching}
            meta={data?.meta}
            onPageChange={setPage}
            empty={<EmptyState description="Không có tài khoản nào khớp bộ lọc" />}
          />
        </Card>
      )}
      <CreateUserModal open={creating} onClose={() => setCreating(false)} />
      <ReasonModal dialog={dialog} onClose={() => setDialog(null)} />
    </div>
  );
};
