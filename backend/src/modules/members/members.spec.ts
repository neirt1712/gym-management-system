import { fromDateOnly, toDateOnly, toSessionCounts, toVnDateTime } from './member.response';

describe('toSessionCounts (domain.md: số buổi PT)', () => {
  it('đã tập = COMPLETED + NO_SHOW, đang giữ = PENDING + CONFIRMED', () => {
    expect(
      toSessionCounts(12, { COMPLETED: 2, NO_SHOW: 1, PENDING: 1, CONFIRMED: 1, CANCELLED: 4, REJECTED: 2 }),
    ).toEqual({
      total: 12,
      used: 3,
      held: 2,
      remaining: 9,
      bookable: 7,
    });
  });

  it('chưa có lịch nào thì còn đủ buổi', () => {
    expect(toSessionCounts(12, {})).toEqual({ total: 12, used: 0, held: 0, remaining: 12, bookable: 12 });
  });

  it('không ra số âm khi dữ liệu lệch', () => {
    expect(toSessionCounts(2, { COMPLETED: 2, PENDING: 1 })).toMatchObject({ remaining: 0, bookable: 0 });
  });
});

describe('định dạng ngày giờ theo openapi', () => {
  it('DateTime đổi sang +07:00', () => {
    expect(toVnDateTime(new Date('2026-10-08T02:30:00Z'))).toBe('2026-10-08T09:30:00+07:00');
    expect(toVnDateTime(new Date('2026-10-08T20:00:00Z'))).toBe('2026-10-09T03:00:00+07:00');
  });

  it('DateOnly đi và về không lệch ngày', () => {
    expect(toDateOnly(fromDateOnly('2000-01-15'))).toBe('2000-01-15');
  });
});
