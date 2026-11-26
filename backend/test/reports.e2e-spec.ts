import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { AccessTokenPayload } from '../src/common/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';

/*
 * Test tích hợp trên DB riêng `gym_test` (cách chuẩn bị: xem đầu test/packages.e2e-spec.ts).
 * Test xóa sạch dữ liệu trước khi chạy nên tên DB bắt buộc kết thúc bằng `_test`.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://gym:gym@localhost:5432/gym_test?schema=public';
if (!new URL(TEST_DATABASE_URL).pathname.endsWith('_test')) {
  throw new Error(`TEST_DATABASE_URL phải trỏ tới DB tên *_test, đang là ${TEST_DATABASE_URL}`);
}
process.env.DATABASE_URL = TEST_DATABASE_URL;

const ID = {
  admin: '00000000-0000-4000-8000-000000000001',
  staff: '00000000-0000-4000-8000-000000000002',
  anUser: '00000000-0000-4000-8000-000000000005',
  binhUser: '00000000-0000-4000-8000-000000000006',
  chiUser: '00000000-0000-4000-8000-000000000007',
  an: '10000000-0000-4000-8000-000000000005',
  binh: '10000000-0000-4000-8000-000000000006',
  chi: '10000000-0000-4000-8000-000000000007',
  gym: '30000000-0000-4000-8000-000000000001',
  pt: '30000000-0000-4000-8000-000000000002',
};

const vnDay = (days: number): string =>
  new Date(Date.now() + 7 * 3600_000 + days * 86400_000).toISOString().slice(0, 10);

describe('Báo cáo (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  const tokenFor = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;
  const admin = () => tokenFor({ sub: ID.admin, role: 'ADMIN', tv: 0 });
  const staff = () => tokenFor({ sub: ID.staff, role: 'STAFF', tv: 0 });
  const http = () => request(app.getHttpServer());
  let n = 0;

  /** Đơn PAID + payment theo giờ VN `paidAt`; trả đơn để gắn gói hội viên. */
  const paid = async (
    memberId: string,
    packageId: string,
    amount: number,
    paidAt: string,
    paymentStatus = 'SUCCESS',
  ) => {
    n += 1;
    const order = await prisma.order.create({
      data: {
        memberId,
        packageId,
        priceSnapshot: amount,
        durationValueSnapshot: 1,
        durationUnitSnapshot: 'MONTH',
        totalSessionsSnapshot: packageId === ID.pt ? 10 : null,
        sessionMinutesSnapshot: packageId === ID.pt ? 60 : null,
        includesClassSnapshot: false,
        startsOn: new Date(paidAt.slice(0, 10)),
        total: amount,
        status: paymentStatus === 'SUCCESS' ? 'PAID' : 'PENDING',
        paidAt: paymentStatus === 'SUCCESS' ? new Date(paidAt) : null,
        expiresAt: new Date(),
        createdBy: ID.admin,
        receiptNo: paymentStatus === 'SUCCESS' ? `BL-TEST-${n}` : null,
      },
    });
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'CASH',
        amount,
        status: paymentStatus as 'SUCCESS' | 'FAILED',
        merchantRef: `REF-${n}`,
        paidAt: paymentStatus === 'SUCCESS' ? new Date(paidAt) : null,
      },
    });
    return order;
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    jwt = moduleRef.get(JwtService);
    prisma = moduleRef.get(PrismaService);

    await prisma.$executeRawUnsafe('TRUNCATE packages, audit_logs, users RESTART IDENTITY CASCADE');
    await prisma.user.createMany({
      data: [
        { id: ID.admin, phone: '0900000001', fullName: 'Quản trị', role: 'ADMIN' },
        { id: ID.staff, phone: '0900000002', fullName: 'Nhân viên', role: 'STAFF' },
        { id: ID.anUser, phone: '0901234567', fullName: 'Nguyễn Văn An', role: 'MEMBER' },
        { id: ID.binhUser, phone: '0912345678', fullName: 'Trần Thị Bình', role: 'MEMBER' },
        { id: ID.chiUser, phone: '0923456789', fullName: 'Lê Chi', role: 'MEMBER' },
      ],
    });
    await prisma.member.createMany({
      data: [
        { id: ID.an, userId: ID.anUser, memberCode: 'HV000001', qrToken: 'qr-an' },
        { id: ID.binh, userId: ID.binhUser, memberCode: 'HV000002', qrToken: 'qr-binh' },
        { id: ID.chi, userId: ID.chiUser, memberCode: 'HV000003', qrToken: 'qr-chi' },
      ],
    });
    await prisma.package.createMany({
      data: [
        {
          id: ID.gym,
          name: 'Gym 1 tháng',
          type: 'GYM',
          price: 300000,
          durationValue: 1,
          durationUnit: 'MONTH',
        },
        {
          id: ID.pt,
          name: 'PT 10 buổi',
          type: 'PT',
          price: 3000000,
          durationValue: 1,
          durationUnit: 'MONTH',
          totalSessions: 10,
          sessionMinutes: 60,
        },
      ],
    });

    // An trả lần đầu tháng 9 (không phải hội viên mới tháng 10), mua thêm PT tháng 10
    const anGym = await paid(ID.an, ID.gym, 300000, '2026-09-20T10:00:00+07:00');
    await paid(ID.an, ID.pt, 3000000, '2026-10-05T10:00:00+07:00');
    const binhGym = await paid(ID.binh, ID.gym, 300000, '2026-10-05T23:30:00+07:00');
    // 23:50 ngày 31/10 giờ VN vẫn thuộc tháng 10; 00:10 ngày 01/11 giờ VN thuộc tháng 11 (UTC còn là 31/10)
    const chiGym = await paid(ID.chi, ID.gym, 300000, '2026-10-31T23:50:00+07:00');
    await paid(ID.chi, ID.gym, 300000, '2026-11-01T00:10:00+07:00');
    // Payment thất bại không tính
    await paid(ID.binh, ID.pt, 3000000, '2026-10-10T10:00:00+07:00', 'FAILED');

    const sub = (
      memberId: string,
      orderId: string,
      startsOn: string,
      endsOn: string,
      status: 'ACTIVE' | 'EXPIRED' | 'FROZEN',
    ) =>
      prisma.subscription.create({
        data: {
          memberId,
          packageId: ID.gym,
          orderId,
          packageName: 'Gym 1 tháng',
          includesClass: false,
          startsOn: new Date(startsOn),
          endsOn: new Date(endsOn),
          status,
        },
      });
    const anSub = await sub(ID.an, anGym.id, vnDay(-5), vnDay(3), 'ACTIVE');
    await sub(ID.binh, binhGym.id, vnDay(-5), vnDay(20), 'ACTIVE');
    await sub(ID.chi, chiGym.id, vnDay(-40), vnDay(-10), 'EXPIRED');

    const checkIn = (at: string) => ({
      memberId: ID.an,
      subscriptionId: anSub.id,
      method: 'QR' as const,
      checkedInAt: new Date(at),
      checkedOutAt: new Date(at),
      checkoutType: 'AUTO' as const,
      checkedInBy: ID.staff,
    });
    await prisma.checkIn.createMany({
      data: [
        checkIn('2026-10-02T07:00:00+07:00'),
        checkIn('2026-10-20T18:00:00+07:00'),
        checkIn('2026-11-01T07:00:00+07:00'),
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const OCT = 'from=2026-10-01&to=2026-10-31';

  describe('UC40 GET /reports/overview', () => {
    it('tháng 10: hội viên mới theo đơn PAID đầu tiên, check-in trong kỳ, gói bán chạy; hội viên và gói sắp hết hạn tính theo hôm nay', async () => {
      const res = await http()
        .get(`/api/v1/reports/overview?${OCT}`)
        .set('Authorization', admin())
        .expect(200);
      expect(res.body).toEqual({
        from: '2026-10-01',
        to: '2026-10-31',
        totalMembers: 2,
        newMembers: 2,
        expiringSoon: 1,
        checkIns: 2,
        popularPackages: [
          { package: { id: ID.gym, name: 'Gym 1 tháng', type: 'GYM' }, paidOrders: 2, revenue: 600000 },
          { package: { id: ID.pt, name: 'PT 10 buổi', type: 'PT' }, paidOrders: 1, revenue: 3000000 },
        ],
      });
    });

    it('không gửi khoảng ngày: tháng hiện tại; Staff: 403; from sau to: 400', async () => {
      const res = await http().get('/api/v1/reports/overview').set('Authorization', admin()).expect(200);
      expect(res.body.from).toBe(`${vnDay(0).slice(0, 7)}-01`);
      expect(res.body.to.slice(0, 7)).toBe(vnDay(0).slice(0, 7));
      await http().get('/api/v1/reports/overview').set('Authorization', staff()).expect(403);
      await http()
        .get('/api/v1/reports/overview?from=2026-10-31&to=2026-10-01')
        .set('Authorization', admin())
        .expect(400);
    });
  });

  describe('UC39 GET /reports/revenue', () => {
    it('theo ngày: đủ 31 kỳ, kỳ trống là 0, tính theo ngày giờ VN, bỏ payment thất bại', async () => {
      const res = await http()
        .get(`/api/v1/reports/revenue?${OCT}`)
        .set('Authorization', admin())
        .expect(200);
      expect(res.body).toMatchObject({ groupBy: 'DAY', totalAmount: 3600000, paymentCount: 3 });
      expect(res.body.series).toHaveLength(31);
      const day = (d: string) => res.body.series.find((s: { period: string }) => s.period === d);
      expect(day('2026-10-05')).toEqual({ period: '2026-10-05', amount: 3300000, paymentCount: 2 });
      expect(day('2026-10-31')).toEqual({ period: '2026-10-31', amount: 300000, paymentCount: 1 });
      expect(day('2026-10-10')).toEqual({ period: '2026-10-10', amount: 0, paymentCount: 0 });
      expect(res.body.byPackage).toEqual([
        { package: { id: ID.pt, name: 'PT 10 buổi', type: 'PT' }, amount: 3000000, paymentCount: 1 },
        { package: { id: ID.gym, name: 'Gym 1 tháng', type: 'GYM' }, amount: 600000, paymentCount: 2 },
      ]);
    });

    it('theo tháng và năm; groupBy sai: 400', async () => {
      const month = await http()
        .get('/api/v1/reports/revenue?from=2026-09-01&to=2026-11-30&groupBy=MONTH')
        .set('Authorization', admin())
        .expect(200);
      expect(month.body.series).toEqual([
        { period: '2026-09', amount: 300000, paymentCount: 1 },
        { period: '2026-10', amount: 3600000, paymentCount: 3 },
        { period: '2026-11', amount: 300000, paymentCount: 1 },
      ]);
      const year = await http()
        .get('/api/v1/reports/revenue?from=2026-01-01&to=2026-12-31&groupBy=YEAR')
        .set('Authorization', admin())
        .expect(200);
      expect(year.body.series).toEqual([{ period: '2026', amount: 4200000, paymentCount: 5 }]);
      await http().get('/api/v1/reports/revenue?groupBy=WEEK').set('Authorization', admin()).expect(400);
    });
  });

  describe('UC40 GET /reports/expiring-subscriptions', () => {
    it('mặc định 7 ngày: chỉ gói của An; 30 ngày: hết hạn sớm nhất trước; days 91: 400', async () => {
      const res = await http()
        .get('/api/v1/reports/expiring-subscriptions')
        .set('Authorization', admin())
        .expect(200);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0]).toMatchObject({ member: { id: ID.an }, endsOn: vnDay(3), daysLeft: 4 });
      const wide = await http()
        .get('/api/v1/reports/expiring-subscriptions?days=30')
        .set('Authorization', admin())
        .expect(200);
      expect(wide.body.data.map((s: { member: { id: string } }) => s.member.id)).toEqual([ID.an, ID.binh]);
      await http()
        .get('/api/v1/reports/expiring-subscriptions?days=91')
        .set('Authorization', admin())
        .expect(400);
      await http().get('/api/v1/reports/expiring-subscriptions').set('Authorization', staff()).expect(403);
    });
  });

  describe('UC41 GET /reports/export', () => {
    it('xuất doanh thu: file xlsx, tên file theo khoảng ngày', async () => {
      const res = await http()
        .get(`/api/v1/reports/export?report=revenue&${OCT}`)
        .set('Authorization', admin())
        .buffer(true)
        .parse((r, cb) => {
          const chunks: Buffer[] = [];
          r.on('data', (c: Buffer) => chunks.push(c));
          r.on('end', () => cb(null, Buffer.concat(chunks)));
        })
        .expect(200);
      expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
      expect(res.headers['content-disposition']).toBe(
        'attachment; filename="doanh-thu_2026-10-01_2026-10-31.xlsx"',
      );
      // File xlsx là file zip: bắt đầu bằng "PK"
      expect((res.body as Buffer).subarray(0, 2).toString()).toBe('PK');
    });

    it('xuất tổng quan và gói sắp hết hạn: 200; thiếu report: 400; Staff: 403', async () => {
      await http()
        .get(`/api/v1/reports/export?report=overview&${OCT}`)
        .set('Authorization', admin())
        .expect(200);
      await http()
        .get('/api/v1/reports/export?report=expiring-subscriptions')
        .set('Authorization', admin())
        .expect(200);
      await http().get('/api/v1/reports/export').set('Authorization', admin()).expect(400);
      await http().get('/api/v1/reports/export?report=revenue').set('Authorization', staff()).expect(403);
    });
  });
});
