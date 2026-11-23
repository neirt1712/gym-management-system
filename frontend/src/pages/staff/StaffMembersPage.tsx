import { App, Button, Card, DatePicker, Form, Input, Modal, Select, Space, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiErrorAlert } from '../../app/feedback/ApiErrorAlert';
import { DataTable, EmptyState, ErrorState, PageHeader } from '../../components';
import { useCreateMember, useMembers, type Member } from '../../features/members/api';
import { getErrorCode, getErrorDetails } from '../../lib/errors';
import { space } from '../../theme/tokens';

type SubFilter = 'ALL' | 'ACTIVE' | 'NONE';
type NewMemberForm = {
  fullName: string;
  phone: string;
  email?: string;
  dob?: { format: (f: string) => string };
};

const PAGE_SIZE = 20;

/** UC20 Thêm hội viên tại quầy: tạo hồ sơ chưa có mật khẩu, xong mở chi tiết. */
const AddMemberModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<NewMemberForm>();
  const create = useCreateMember();
  const duplicateId =
    getErrorCode(create.error) === 'PHONE_DUPLICATED'
      ? getErrorDetails<{ memberId?: string }>(create.error)?.memberId
      : undefined;

  const close = () => {
    form.resetFields();
    create.reset();
    onClose();
  };

  const submit = (v: NewMemberForm) =>
    create.mutate(
      {
        fullName: v.fullName.trim(),
        phone: v.phone.trim(),
        email: v.email?.trim() || null,
        dob: v.dob?.format('YYYY-MM-DD') ?? null,
      },
      {
        onSuccess: (member) => {
          void message.success('Đã thêm hội viên');
          close();
          navigate(`/staff/members/${member.id}`);
        },
      },
    );

  return (
    <Modal
      open={open}
      title="Thêm hội viên"
      okText="Thêm hội viên"
      cancelText="Đóng"
      okButtonProps={{ loading: create.isPending, htmlType: 'submit', form: 'add-member' }}
      onCancel={close}
      destroyOnClose
    >
      {create.isError && (
        <ApiErrorAlert
          error={create.error}
          action={
            duplicateId && (
              <Button size="small" onClick={() => navigate(`/staff/members/${duplicateId}`)}>
                Mở hồ sơ
              </Button>
            )
          }
        />
      )}
      <Form id="add-member" form={form} layout="vertical" onFinish={submit} requiredMark="optional">
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
        <Form.Item
          name="email"
          label="Email"
          extra="Không bắt buộc. Có email thì hội viên tự kích hoạt qua Quên mật khẩu."
          rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
        >
          <Input maxLength={255} />
        </Form.Item>
        <Form.Item name="dob" label="Ngày sinh">
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/** UC19, UC20 Hội viên (`/staff/members`): tìm theo tên, SĐT, mã; lọc có gói hay chưa; thêm hồ sơ tại quầy. */
export const StaffMembersPage = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [sub, setSub] = useState<SubFilter>('ALL');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const { data, isPending, isFetching, isError, error, refetch } = useMembers({
    page,
    pageSize: PAGE_SIZE,
    ...(q ? { q } : {}),
    ...(sub !== 'ALL' ? { hasActiveSubscription: sub === 'ACTIVE' } : {}),
  });

  const reset = () => {
    setQ('');
    setSub('ALL');
    setPage(1);
  };

  const columns: TableColumnsType<Member> = [
    { title: 'Mã', dataIndex: 'memberCode' },
    { title: 'Họ tên', dataIndex: 'fullName' },
    { title: 'Số điện thoại', dataIndex: 'phone' },
    {
      title: 'Gói',
      render: (_, m) =>
        m.hasActiveSubscription ? <Tag color="success">Hội viên</Tag> : <Tag>Khách hàng (chưa có gói)</Tag>,
    },
    {
      title: 'Tài khoản',
      render: (_, m) =>
        m.accountStatus === 'LOCKED' ? (
          <Tag color="error">Đã khóa</Tag>
        ) : m.accountActivated ? (
          <Tag color="success">Đã kích hoạt</Tag>
        ) : (
          <Tag color="warning">Chưa kích hoạt</Tag>
        ),
    },
    {
      title: 'Thao tác',
      render: (_, m) => <Button onClick={() => navigate(`/staff/members/${m.id}`)}>Xem</Button>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Hội viên"
        description="Tìm, thêm hồ sơ; mua gói hộ và thu tiền trong chi tiết hội viên."
        extra={
          <Button type="primary" onClick={() => setAdding(true)}>
            Thêm hội viên
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
            aria-label="Tìm hội viên"
            placeholder="Tên, số điện thoại hoặc mã"
            allowClear
            key={q === '' ? 'empty' : 'filled'}
            defaultValue={q}
            onSearch={(v) => {
              setQ(v.trim());
              setPage(1);
            }}
            style={{ width: 300 }}
          />
          <Select<SubFilter>
            aria-label="Trạng thái gói"
            value={sub}
            onChange={(v) => {
              setSub(v);
              setPage(1);
            }}
            style={{ width: 200 }}
            options={[
              { value: 'ALL', label: 'Tất cả' },
              { value: 'ACTIVE', label: 'Đang có gói' },
              { value: 'NONE', label: 'Chưa có gói' },
            ]}
          />
        </Space>
        <Button onClick={reset}>Đặt lại</Button>
      </Space>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <Card>
          <DataTable<Member>
            columns={columns}
            rows={data?.data}
            rowKey="id"
            loading={isPending || isFetching}
            meta={data?.meta}
            onPageChange={setPage}
            empty={
              <EmptyState
                description="Không tìm thấy hội viên nào"
                action={<Button onClick={() => setAdding(true)}>Thêm hội viên mới</Button>}
              />
            }
          />
        </Card>
      )}
      <AddMemberModal open={adding} onClose={() => setAdding(false)} />
    </div>
  );
};
