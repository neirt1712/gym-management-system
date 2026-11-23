import { App, Button, DatePicker, Form, Input, Modal, Radio, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { ApiErrorAlert } from '../../../app/feedback/ApiErrorAlert';
import { getErrorCode } from '../../../lib/errors';
import { TZ } from '../../../lib/format';
import { space } from '../../../theme/tokens';
import {
  useAcceptAppointment,
  useCompleteAppointment,
  useProposeAppointment,
  useRejectAppointment,
  type AppointmentDetail,
} from '../api';

type Dialog = 'COUNTER' | 'RESCHEDULE' | 'CANCEL' | 'REJECT' | 'COMPLETE' | null;

const TITLE: Record<Exclude<Dialog, null>, string> = {
  COUNTER: 'Đề xuất giờ khác',
  RESCHEDULE: 'Xin đổi lịch',
  CANCEL: 'Xin hủy lịch này?',
  REJECT: 'Từ chối đề xuất này?',
  COMPLETE: 'Xác nhận buổi tập',
};

type Props = { appointment: AppointmentDetail; onReload: () => void };

/**
 * UC24–UC27 Nút theo `allowedActions`, mọi hành động gửi `expectedVersion` (domain.md).
 * Gặp STALE_VERSION: báo người dùng và tải lại lịch. Khóa nút khi đang gửi.
 */
export const AppointmentActions = ({ appointment: a, onReload }: Props) => {
  const { message } = App.useApp();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form] = Form.useForm<{
    startsAt?: Dayjs;
    note?: string;
    reason?: string;
    result?: 'COMPLETED' | 'NO_SHOW';
  }>();
  const accept = useAcceptAppointment();
  const reject = useRejectAppointment();
  const propose = useProposeAppointment();
  const complete = useCompleteAppointment();
  const busy = accept.isPending || reject.isPending || propose.isPending || complete.isPending;
  const error = accept.error ?? reject.error ?? propose.error ?? complete.error;
  const can = (action: string) => a.allowedActions.includes(action as never);

  const handleError = (e: unknown) => {
    if (getErrorCode(e) === 'STALE_VERSION') {
      void message.warning('Lịch vừa được bên kia cập nhật. Đã tải lại.');
      setDialog(null);
      onReload();
    }
  };
  const done = (text: string) => {
    void message.success(text);
    setDialog(null);
    form.resetFields();
  };
  const open = (d: Dialog) => {
    accept.reset();
    reject.reset();
    propose.reset();
    complete.reset();
    form.resetFields();
    setDialog(d);
  };

  const submit = (v: {
    startsAt?: Dayjs;
    note?: string;
    reason?: string;
    result?: 'COMPLETED' | 'NO_SHOW';
  }) => {
    const expectedVersion = a.version;
    const note = v.note?.trim() || null;
    if (dialog === 'REJECT') {
      reject.mutate(
        { id: a.id, expectedVersion, reason: (v.reason ?? '').trim() },
        { onSuccess: () => done('Đã từ chối'), onError: handleError },
      );
    } else if (dialog === 'COMPLETE') {
      complete.mutate(
        { id: a.id, body: { result: v.result ?? 'COMPLETED', note, expectedVersion } },
        { onSuccess: () => done('Đã xác nhận buổi tập'), onError: handleError },
      );
    } else if (dialog) {
      propose.mutate(
        {
          id: a.id,
          body: {
            kind: dialog,
            expectedVersion,
            note,
            ...(dialog !== 'CANCEL' && v.startsAt ? { startsAt: v.startsAt.tz(TZ, true).format() } : {}),
          },
        },
        { onSuccess: () => done('Đã gửi đề xuất'), onError: handleError },
      );
    }
  };

  if (a.allowedActions.length === 0) return null;

  return (
    <>
      <Space wrap>
        {can('ACCEPT') && (
          <Button
            type="primary"
            loading={accept.isPending}
            disabled={busy}
            onClick={() =>
              accept.mutate(
                { id: a.id, expectedVersion: a.version },
                { onSuccess: () => void message.success('Đã đồng ý'), onError: handleError },
              )
            }
          >
            Đồng ý
          </Button>
        )}
        {can('COUNTER') && (
          <Button disabled={busy} onClick={() => open('COUNTER')}>
            Đề xuất giờ khác
          </Button>
        )}
        {can('REJECT') && (
          <Button danger disabled={busy} onClick={() => open('REJECT')}>
            Từ chối
          </Button>
        )}
        {can('RESCHEDULE') && (
          <Button disabled={busy} onClick={() => open('RESCHEDULE')}>
            Xin đổi lịch
          </Button>
        )}
        {can('CANCEL') && (
          <Button danger disabled={busy} onClick={() => open('CANCEL')}>
            Xin hủy lịch
          </Button>
        )}
        {can('COMPLETE') && (
          <Button type="primary" disabled={busy} onClick={() => open('COMPLETE')}>
            Xác nhận buổi tập
          </Button>
        )}
      </Space>
      {!dialog && accept.isError && getErrorCode(accept.error) !== 'STALE_VERSION' && (
        <div style={{ marginTop: space.md }}>
          <ApiErrorAlert error={accept.error} />
        </div>
      )}

      <Modal
        open={!!dialog}
        title={dialog ? TITLE[dialog] : ''}
        okText={
          dialog === 'REJECT'
            ? 'Từ chối'
            : dialog === 'CANCEL'
              ? 'Gửi yêu cầu hủy'
              : dialog === 'COMPLETE'
                ? 'Xác nhận'
                : 'Gửi đề xuất'
        }
        okButtonProps={{
          danger: dialog === 'REJECT' || dialog === 'CANCEL',
          loading: busy,
          htmlType: 'submit',
          form: 'appointment-action',
        }}
        cancelText="Đóng"
        onCancel={() => setDialog(null)}
        destroyOnClose
      >
        {error && getErrorCode(error) !== 'STALE_VERSION' && <ApiErrorAlert error={error} />}
        <Form id="appointment-action" form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          {(dialog === 'COUNTER' || dialog === 'RESCHEDULE') && (
            <Form.Item
              name="startsAt"
              label="Giờ bắt đầu mới"
              rules={[{ required: true, message: 'Chọn giờ' }]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm', minuteStep: 15 }}
                format="HH:mm DD/MM/YYYY"
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
          {dialog === 'REJECT' && (
            <Form.Item
              name="reason"
              label="Lý do"
              rules={[{ required: true, whitespace: true, message: 'Nhập lý do' }]}
            >
              <Input.TextArea maxLength={500} autoSize={{ minRows: 2 }} />
            </Form.Item>
          )}
          {dialog === 'COMPLETE' && (
            <Form.Item name="result" label="Kết quả" initialValue="COMPLETED">
              <Radio.Group>
                <Radio value="COMPLETED">Đã tập</Radio>
                <Radio value="NO_SHOW">Vắng mặt (vẫn trừ 1 buổi)</Radio>
              </Radio.Group>
            </Form.Item>
          )}
          {dialog !== 'REJECT' && (
            <Form.Item name="note" label="Ghi chú">
              <Input.TextArea maxLength={500} autoSize={{ minRows: 2 }} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
};
