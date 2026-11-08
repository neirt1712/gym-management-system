import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Checkbox, Space, TimePicker, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { ApiErrorAlert } from '../../app/feedback/ApiErrorAlert';
import { ErrorState, PageHeader } from '../../components';
import { expandTemplate, type WeeklyTemplate } from '../../features/appointments/slots';
import { useMe } from '../../features/profile/api';
import { useReplaceAvailability } from '../../features/trainers/api';
import { TZ } from '../../lib/format';
import { space } from '../../theme/tokens';

const WEEKDAYS = [
  { day: 1, label: 'Thứ Hai' },
  { day: 2, label: 'Thứ Ba' },
  { day: 3, label: 'Thứ Tư' },
  { day: 4, label: 'Thứ Năm' },
  { day: 5, label: 'Thứ Sáu' },
  { day: 6, label: 'Thứ Bảy' },
  { day: 0, label: 'Chủ Nhật' },
];
const WEEKS = 4;

type Range = [Dayjs, Dayjs];
const DEFAULT_RANGE: Range = [dayjs('08:00', 'HH:mm'), dayjs('12:00', 'HH:mm')];

/**
 * UC22 PT thiết lập khung giờ theo mẫu tuần → FE sinh các khoảng cho 4 tuần → PUT (quyết định 14).
 * BE thay toàn bộ khung giờ trong 4 tuần đó; lịch đã có không bị ảnh hưởng.
 */
export const TrainerAvailabilityPage = () => {
  const { message } = App.useApp();
  const me = useMe();
  const save = useReplaceAvailability();
  const [template, setTemplate] = useState<Record<number, Range[]>>({});

  const toggleDay = (day: number, on: boolean) =>
    setTemplate((t) => ({ ...t, [day]: on ? [DEFAULT_RANGE] : [] }));
  const setRange = (day: number, index: number, range: Range | null) =>
    setTemplate((t) => ({
      ...t,
      [day]: (t[day] ?? []).map((r, i) => (i === index && range ? range : r)),
    }));
  const addRange = (day: number) => setTemplate((t) => ({ ...t, [day]: [...(t[day] ?? []), DEFAULT_RANGE] }));
  const removeRange = (day: number, index: number) =>
    setTemplate((t) => ({ ...t, [day]: (t[day] ?? []).filter((_, i) => i !== index) }));

  const submit = () => {
    const trainerId = me.data?.trainer?.id;
    if (!trainerId) return;
    const from = dayjs().tz(TZ).format('YYYY-MM-DD');
    const to = dayjs()
      .tz(TZ)
      .add(WEEKS * 7 - 1, 'day')
      .format('YYYY-MM-DD');
    const weekly: WeeklyTemplate = Object.fromEntries(
      Object.entries(template).map(([day, ranges]) => [
        Number(day),
        ranges.map(([s, e]) => ({ from: s.format('HH:mm'), to: e.format('HH:mm') })),
      ]),
    );
    save.mutate(
      { id: trainerId, body: { from, to, slots: expandTemplate(weekly, from, WEEKS) } },
      { onSuccess: () => void message.success('Đã lưu khung giờ') },
    );
  };

  if (me.isError) return <ErrorState error={me.error} onRetry={() => void me.refetch()} />;

  return (
    <div>
      <PageHeader
        title="Khung giờ rảnh"
        description={`Chọn giờ nhận lịch theo thứ trong tuần. Hệ thống áp dụng cho ${WEEKS} tuần tới, thay khung giờ cũ trong khoảng đó; lịch đã có giữ nguyên.`}
        extra={
          <Button type="primary" loading={save.isPending} disabled={!me.data?.trainer} onClick={submit}>
            Lưu khung giờ
          </Button>
        }
      />
      {save.isError && <ApiErrorAlert error={save.error} />}
      <Card>
        <Space direction="vertical" size={space.md} style={{ width: '100%' }}>
          {WEEKDAYS.map(({ day, label }) => {
            const ranges = template[day] ?? [];
            return (
              <Space key={day} align="start" wrap size={space.md}>
                <Checkbox
                  checked={ranges.length > 0}
                  onChange={(e) => toggleDay(day, e.target.checked)}
                  style={{ width: 120 }}
                >
                  {label}
                </Checkbox>
                {ranges.length === 0 ? (
                  <Typography.Text type="secondary">Nghỉ</Typography.Text>
                ) : (
                  <Space direction="vertical" size={space.sm}>
                    {ranges.map((r, i) => (
                      <Space key={i}>
                        <TimePicker.RangePicker
                          aria-label={`${label} khoảng ${i + 1}`}
                          format="HH:mm"
                          minuteStep={15}
                          value={r}
                          onChange={(v) => setRange(day, i, v && v[0] && v[1] ? [v[0], v[1]] : null)}
                        />
                        <Button
                          aria-label={`Xóa khoảng ${i + 1} ${label}`}
                          icon={<DeleteOutlined />}
                          onClick={() => removeRange(day, i)}
                        />
                      </Space>
                    ))}
                    <Button icon={<PlusOutlined />} onClick={() => addRange(day)}>
                      Thêm khoảng
                    </Button>
                  </Space>
                )}
              </Space>
            );
          })}
        </Space>
      </Card>
    </div>
  );
};
