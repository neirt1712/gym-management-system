import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/vi';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('vi');

export const TZ = 'Asia/Ho_Chi_Minh';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

/** 1200000 → "1.200.000 ₫" */
export const formatVND = (amount: number): string => vnd.format(amount);

/** "2026-10-05" hoặc ISO → "05/10/2026" */
export const formatDate = (value: string): string => dayjs.tz(value, TZ).format('DD/MM/YYYY');

/** ISO → "18:00 05/10/2026" */
export const formatDateTime = (value: string): string => dayjs(value).tz(TZ).format('HH:mm DD/MM/YYYY');

/** (start, end) → "18:00–19:00, T2 05/10" */
export const formatTimeRange = (start: string, end: string): string => {
  const s = dayjs(start).tz(TZ);
  const e = dayjs(end).tz(TZ);
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].at(s.day());
  return `${s.format('HH:mm')}–${e.format('HH:mm')}, ${weekday} ${s.format('DD/MM')}`;
};

/** (7, 12) → "Còn 7/12 buổi" */
export const formatSessionsLeft = (remaining: number, total: number): string => `Còn ${remaining}/${total} buổi`;
