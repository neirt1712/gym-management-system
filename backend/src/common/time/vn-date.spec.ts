import { addDays, computeEndsOn, daysLeft, todayVn, vnDayEnd } from './vn-date';

describe('computeEndsOn (quyết định 12)', () => {
  it.each([
    ['2026-10-10', 1, '2026-11-09'],
    ['2026-01-31', 1, '2026-02-27'],
    ['2024-01-31', 1, '2024-02-28'],
    ['2026-12-15', 2, '2027-02-14'],
    ['2026-03-31', 1, '2026-04-29'],
  ])('%s + %i tháng kết thúc %s', (startsOn, months, expected) => {
    expect(computeEndsOn(startsOn, months, 'MONTH')).toBe(expected);
  });

  it('tính theo ngày', () => {
    expect(computeEndsOn('2026-10-10', 30, 'DAY')).toBe('2026-11-08');
  });
});

describe('giờ Việt Nam', () => {
  it('17:00 UTC đã sang ngày hôm sau ở Việt Nam', () => {
    expect(todayVn(new Date('2026-11-04T17:00:00Z'))).toBe('2026-11-05');
  });

  it('cuối ngày theo +07:00', () => {
    expect(vnDayEnd('2026-11-05').toISOString()).toBe('2026-11-05T16:59:59.000Z');
  });

  it('cộng ngày qua cuối tháng', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});

describe('daysLeft', () => {
  it('tính cả hai đầu', () => {
    expect(daysLeft('2026-11-05', '2026-11-05')).toBe(1);
    expect(daysLeft('2026-11-09', '2026-11-05')).toBe(5);
  });

  it('đã qua ngày cuối thì 0', () => {
    expect(daysLeft('2026-11-04', '2026-11-05')).toBe(0);
  });
});
