import dayjs from 'dayjs';
import { TZ } from '../../lib/format';
import type { TimeRange } from '../trainers/api';

export type SlotOption = { startsAt: string; label: string; day: string };

const STEP_MINUTES = 30;
const overlaps = (aStart: number, aEnd: number, b: TimeRange) =>
  aStart < dayjs(b.endsAt).valueOf() && dayjs(b.startsAt).valueOf() < aEnd;

/**
 * Giờ bắt đầu có thể chọn: mỗi 30 phút trong khung rảnh, đủ chỗ cho một buổi, không trùng giờ bận, chưa qua.
 * BE không chặn giờ ngoài khung rảnh (Q20c) nên FE chỉ cho chọn trong khung rảnh.
 */
export const bookableStarts = (
  slots: TimeRange[],
  busy: TimeRange[],
  sessionMinutes: number,
  now: dayjs.Dayjs = dayjs(),
): SlotOption[] => {
  const options: SlotOption[] = [];
  for (const slot of slots) {
    const end = dayjs(slot.endsAt);
    for (
      let start = dayjs(slot.startsAt);
      !start.add(sessionMinutes, 'minute').isAfter(end);
      start = start.add(STEP_MINUTES, 'minute')
    ) {
      const s = start.valueOf();
      const e = start.add(sessionMinutes, 'minute').valueOf();
      if (start.isBefore(now) || busy.some((b) => overlaps(s, e, b))) continue;
      const local = start.tz(TZ);
      options.push({
        startsAt: local.format(),
        label: local.format('HH:mm'),
        day: local.format('YYYY-MM-DD'),
      });
    }
  }
  return options;
};

/** Mẫu khung giờ theo thứ trong tuần (0 = CN … 6 = T7), giờ dạng "HH:mm". */
export type WeeklyTemplate = Record<number, { from: string; to: string }[]>;

/** UC22 Sinh các khoảng cho `weeks` tuần từ ngày `from` theo mẫu tuần (quyết định 14: FE sinh, BE nhận PUT). */
export const expandTemplate = (template: WeeklyTemplate, from: string, weeks: number): TimeRange[] => {
  const ranges: TimeRange[] = [];
  const first = dayjs.tz(from, TZ);
  for (let i = 0; i < weeks * 7; i += 1) {
    const day = first.add(i, 'day');
    for (const { from: f, to: t } of template[day.day()] ?? []) {
      const [fh, fm] = f.split(':').map(Number);
      const [th, tm] = t.split(':').map(Number);
      ranges.push({
        startsAt: day
          .hour(fh ?? 0)
          .minute(fm ?? 0)
          .second(0)
          .format(),
        endsAt: day
          .hour(th ?? 0)
          .minute(tm ?? 0)
          .second(0)
          .format(),
      });
    }
  }
  return ranges;
};
