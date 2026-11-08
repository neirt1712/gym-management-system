import { msUntilNextVn2359 } from './auto-checkout.job';

const MIN = 60 * 1000;

describe('msUntilNextVn2359', () => {
  it('trước 23:59 giờ VN thì chờ tới 23:59 cùng ngày', () => {
    expect(msUntilNextVn2359(new Date('2026-11-08T23:00:00+07:00'))).toBe(59 * MIN);
  });

  it('sau 23:59 giờ VN thì chờ tới 23:59 hôm sau', () => {
    expect(msUntilNextVn2359(new Date('2026-11-08T23:59:30+07:00'))).toBe(24 * 60 * MIN - 30 * 1000);
  });

  it('tính theo giờ VN dù máy chạy UTC', () => {
    // 16:00 UTC = 23:00 giờ VN
    expect(msUntilNextVn2359(new Date('2026-11-08T16:00:00Z'))).toBe(59 * MIN);
  });
});
