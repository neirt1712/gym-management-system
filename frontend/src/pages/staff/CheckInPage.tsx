import { Alert, App, Button, Card, Col, Form, Input, Row, Segmented } from 'antd';
import type { TableColumnsType } from 'antd';
import { useState } from 'react';
import { ApiErrorAlert } from '../../app/feedback/ApiErrorAlert';
import { DataTable, EmptyState, ErrorState, PageHeader } from '../../components';
import { useCheckIns, useCheckOut, useCreateCheckIn, type CheckIn } from '../../features/checkins/api';
import { formatDate, formatDateTime } from '../../lib/format';
import { space } from '../../theme/tokens';

type Mode = 'QR' | 'PHONE';

/**
 * UC16–UC18 Check-in tại quầy (`/staff/check-in`): nhập mã QR (máy quét gõ vào ô) hoặc SĐT; danh sách đang trong phòng, check-out hộ.
 * Mỗi hội viên chỉ 1 lượt chưa check-out (ALREADY_CHECKED_IN); job 23:59 tự đóng. Quét bằng camera chưa làm.
 */
export const CheckInPage = () => {
  const { message } = App.useApp();
  const [mode, setMode] = useState<Mode>('QR');
  const [last, setLast] = useState<CheckIn | null>(null);
  const [form] = Form.useForm<{ value: string }>();
  const create = useCreateCheckIn();
  const checkOut = useCheckOut();
  const present = useCheckIns({ present: true, pageSize: 100 });

  const submit = ({ value }: { value: string }) => {
    const v = value.trim();
    create.mutate(mode === 'QR' ? { qrToken: v } : { phone: v }, {
      onSuccess: (checkIn) => {
        setLast(checkIn);
        form.resetFields();
        void message.success('Đã check-in');
      },
    });
  };

  const columns: TableColumnsType<CheckIn> = [
    { title: 'Hội viên', render: (_, c) => `${c.member.fullName} · ${c.member.memberCode}` },
    { title: 'Gói', render: (_, c) => c.subscription.packageName },
    { title: 'Vào lúc', render: (_, c) => formatDateTime(c.checkedInAt) },
    {
      title: 'Thao tác',
      render: (_, c) => (
        <Button
          loading={checkOut.isPending && checkOut.variables === c.id}
          onClick={() => checkOut.mutate(c.id, { onSuccess: () => void message.success('Đã check-out') })}
        >
          Check-out
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Check-in"
        description="Lượt chưa check-out tự đóng lúc 23:59. Check-in không trừ buổi PT."
      />
      <Row gutter={[space.lg, space.lg]}>
        <Col xs={24} lg={10}>
          <Card title="Check-in hội viên">
            <Segmented<Mode>
              aria-label="Cách check-in"
              value={mode}
              onChange={(m) => {
                setMode(m);
                create.reset();
                form.resetFields();
              }}
              options={[
                { label: 'Mã QR', value: 'QR' },
                { label: 'Số điện thoại', value: 'PHONE' },
              ]}
              style={{ marginBottom: space.md }}
            />
            {create.isError && <ApiErrorAlert error={create.error} />}
            <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
              <Form.Item
                name="value"
                label={mode === 'QR' ? 'Mã QR' : 'Số điện thoại'}
                rules={
                  mode === 'QR'
                    ? [{ required: true, whitespace: true, message: 'Quét hoặc nhập mã QR' }]
                    : [
                        { required: true, message: 'Nhập số điện thoại' },
                        { pattern: /^0\d{9}$/, message: 'Số điện thoại gồm 10 số, bắt đầu bằng 0' },
                      ]
                }
              >
                <Input autoFocus inputMode={mode === 'PHONE' ? 'tel' : undefined} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={create.isPending} block>
                Check-in
              </Button>
            </Form>
            {last && (
              <Alert
                style={{ marginTop: space.md }}
                type={last.expiringSoon ? 'warning' : 'success'}
                showIcon
                message={`${last.member.fullName} đã vào lúc ${formatDateTime(last.checkedInAt)}`}
                description={
                  last.expiringSoon
                    ? `Gói ${last.subscription.packageName} sắp hết hạn (${formatDate(last.subscription.endsOn)}, còn ${last.subscription.daysLeft} ngày). Nhắc hội viên gia hạn.`
                    : `Gói ${last.subscription.packageName}, hết hạn ${formatDate(last.subscription.endsOn)}.`
                }
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title={`Đang trong phòng${present.data ? ` (${present.data.meta.total})` : ''}`}>
            {present.isError ? (
              <ErrorState error={present.error} onRetry={() => void present.refetch()} />
            ) : (
              <DataTable<CheckIn>
                columns={columns}
                rows={present.data?.data}
                rowKey="id"
                loading={present.isPending}
                empty={<EmptyState description="Chưa có ai trong phòng" />}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
