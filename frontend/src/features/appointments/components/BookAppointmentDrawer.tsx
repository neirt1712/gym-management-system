import { App, Button, Drawer, Empty, Form, Input, Select, Skeleton, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { ApiErrorAlert } from '../../../app/feedback/ApiErrorAlert';
import { formatDate, formatSessionsLeft } from '../../../lib/format';
import { space } from '../../../theme/tokens';
import { useSubscriptions } from '../../subscriptions/api';
import { useAvailability, useTrainers } from '../../trainers/api';
import { useCreateAppointment } from '../api';
import { bookableStarts } from '../slots';

type Props = {
  open: boolean;
  onClose: () => void;
  /** PT chọn sẵn (mở từ hồ sơ PT). */
  trainerId?: string;
  onBooked: (appointmentId: string) => void;
};

/**
 * UC23 Hội viên đề xuất lịch: chọn gói PT còn buổi, chọn PT, chọn giờ trong khung rảnh (hiện số buổi có thể đặt).
 * Lịch tạo ra ở trạng thái chờ PT trả lời.
 */
export const BookAppointmentDrawer = ({ open, onClose, trainerId: presetTrainer, onBooked }: Props) => {
  const { message } = App.useApp();
  const [subscriptionId, setSubscriptionId] = useState<string>();
  const [trainerId, setTrainerId] = useState<string | undefined>(presetTrainer);
  const [startsAt, setStartsAt] = useState<string>();
  const [note, setNote] = useState('');
  const subs = useSubscriptions({ status: ['ACTIVE'], type: 'PT' });
  const trainers = useTrainers({ pageSize: 100 });
  const availability = useAvailability(trainerId ?? '');
  const create = useCreateAppointment();

  const sub = subs.data?.data.find((s) => s.id === subscriptionId);
  const options = useMemo(
    () =>
      availability.data && sub?.sessionMinutes
        ? bookableStarts(availability.data.slots, availability.data.busy, sub.sessionMinutes)
        : [],
    [availability.data, sub?.sessionMinutes],
  );
  const grouped = useMemo(() => {
    const byDay = new Map<string, { label: string; value: string }[]>();
    for (const o of options)
      byDay.set(o.day, [...(byDay.get(o.day) ?? []), { label: o.label, value: o.startsAt }]);
    return [...byDay.entries()].map(([day, opts]) => ({ label: formatDate(day), options: opts }));
  }, [options]);

  const close = () => {
    setSubscriptionId(undefined);
    setStartsAt(undefined);
    setNote('');
    create.reset();
    onClose();
  };

  const submit = () => {
    if (!subscriptionId || !trainerId || !startsAt) return;
    create.mutate(
      { subscriptionId, trainerId, startsAt, note: note.trim() || null },
      {
        onSuccess: (appointment) => {
          void message.success('Đã gửi đề xuất');
          close();
          onBooked(appointment.id);
        },
      },
    );
  };

  const noSessions = sub?.sessions && sub.sessions.bookable === 0;

  return (
    <Drawer open={open} onClose={close} title="Đặt lịch với PT" width={520} destroyOnClose>
      <Form layout="vertical" onFinish={submit} requiredMark={false}>
        {create.isError && <ApiErrorAlert error={create.error} />}
        <Form.Item label="Gói PT" required>
          {subs.isPending ? (
            <Skeleton.Input active block />
          ) : subs.data?.data.length ? (
            <Select
              aria-label="Gói PT"
              placeholder="Chọn gói PT"
              value={subscriptionId}
              onChange={(v) => {
                setSubscriptionId(v);
                setStartsAt(undefined);
              }}
              options={subs.data.data.map((s) => ({
                value: s.id,
                label: `${s.packageName}${s.sessions ? ` · ${formatSessionsLeft(s.sessions.remaining, s.sessions.total)}, đặt được ${s.sessions.bookable}` : ''}`,
              }))}
            />
          ) : (
            <Empty description="Bạn chưa có gói PT đang hiệu lực" />
          )}
        </Form.Item>
        {noSessions && (
          <Typography.Paragraph type="warning">Gói này đã hết buổi có thể đặt.</Typography.Paragraph>
        )}
        <Form.Item label="Huấn luyện viên" required>
          <Select
            aria-label="Huấn luyện viên"
            placeholder="Chọn PT"
            loading={trainers.isPending}
            value={trainerId}
            onChange={(v) => {
              setTrainerId(v);
              setStartsAt(undefined);
            }}
            options={trainers.data?.data
              .filter((t) => t.status === 'ACTIVE')
              .map((t) => ({
                value: t.id,
                label: `${t.fullName}${t.specialties.length ? ` · ${t.specialties.join(', ')}` : ''}`,
              }))}
          />
        </Form.Item>
        <Form.Item label="Giờ bắt đầu" required extra="Chỉ hiện giờ trong khung rảnh của PT, 4 tuần tới.">
          {availability.isFetching ? (
            <Skeleton.Input active block />
          ) : (
            <Select
              aria-label="Giờ bắt đầu"
              placeholder={sub && trainerId ? 'Chọn giờ' : 'Chọn gói và PT trước'}
              disabled={!sub || !trainerId || !!noSessions}
              value={startsAt}
              onChange={setStartsAt}
              options={grouped}
              notFoundContent="PT chưa có khung giờ trống"
            />
          )}
        </Form.Item>
        <Form.Item label="Ghi chú">
          <Input.TextArea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            autoSize={{ minRows: 2 }}
          />
        </Form.Item>
        <Space size={space.sm}>
          <Button type="primary" htmlType="submit" loading={create.isPending} disabled={!startsAt}>
            Gửi đề xuất
          </Button>
          <Button onClick={close}>Đóng</Button>
        </Space>
      </Form>
    </Drawer>
  );
};
