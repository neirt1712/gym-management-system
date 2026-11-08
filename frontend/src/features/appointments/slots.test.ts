import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { bookableStarts, expandTemplate } from './slots';

describe('bookableStarts', () => {
  const slot = { startsAt: '2026-11-10T08:00:00+07:00', endsAt: '2026-11-10T10:00:00+07:00' };
  const now = dayjs('2026-11-09T00:00:00+07:00');

  it('mỗi 30 phút, đủ chỗ cho buổi 60 phút', () => {
    expect(bookableStarts([slot], [], 60, now).map((o) => o.label)).toEqual(['08:00', '08:30', '09:00']);
  });

  it('bỏ giờ trùng lịch đã bận', () => {
    const busy = [{ startsAt: '2026-11-10T08:30:00+07:00', endsAt: '2026-11-10T09:00:00+07:00' }];
    expect(bookableStarts([slot], busy, 60, now).map((o) => o.label)).toEqual(['09:00']);
  });

  it('bỏ giờ đã qua', () => {
    expect(bookableStarts([slot], [], 60, dayjs('2026-11-10T08:15:00+07:00')).map((o) => o.label)).toEqual([
      '08:30',
      '09:00',
    ]);
  });
});

describe('expandTemplate', () => {
  it('sinh khoảng theo thứ trong tuần cho số tuần yêu cầu', () => {
    // 09/11/2026 là Thứ Hai (day() = 1)
    const ranges = expandTemplate({ 1: [{ from: '08:00', to: '12:00' }] }, '2026-11-09', 2);
    expect(ranges).toHaveLength(2);
    expect(dayjs(ranges[0]?.startsAt).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm')).toBe(
      '2026-11-09 08:00',
    );
    expect(dayjs(ranges[1]?.endsAt).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm')).toBe(
      '2026-11-16 12:00',
    );
  });
});
