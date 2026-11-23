import type { DurationUnit } from '@prisma/client';

/** Việt Nam không có giờ mùa hè nên lệch cố định +07:00. Ngày thuần luôn là chuỗi YYYY-MM-DD. */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const todayVn = (now: Date = new Date()): string =>
  new Date(now.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);

export const vnDayStart = (day: string): Date => new Date(`${day}T00:00:00+07:00`);

export const vnDayEnd = (day: string): Date => new Date(`${day}T23:59:59+07:00`);

export const addDays = (day: string, days: number): string =>
  new Date(new Date(`${day}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

const addMonths = (day: string, months: number): string => {
  const [year, month, date] = day.split('-').map(Number);
  const firstOfTarget = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDate = new Date(
    Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, 0),
  ).getUTCDate();
  firstOfTarget.setUTCDate(Math.min(date, lastDate));
  return firstOfTarget.toISOString().slice(0, 10);
};

/** Quyết định 12: ngày kết thúc = ngày bắt đầu + thời hạn − 1 ngày, tính cả ngày đó. */
export const computeEndsOn = (startsOn: string, value: number, unit: DurationUnit): string =>
  addDays(unit === 'MONTH' ? addMonths(startsOn, value) : addDays(startsOn, value), -1);

/** Số ngày từ hôm nay đến ngày cuối, tính cả hai đầu; 0 khi đã qua. */
export const daysLeft = (endsOn: string, today: string = todayVn()): number => {
  const diff = new Date(`${endsOn}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime();
  return Math.max(diff / DAY_MS + 1, 0);
};
