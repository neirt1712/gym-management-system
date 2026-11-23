import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { AccessTokenPayload } from '../src/common/auth/jwt-auth.guard';
import { SubscriptionFreezeService } from '../src/modules/subscriptions/subscription-freeze.service';
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
  ptUser: '00000000-0000-4000-8000-000000000003',
  anUser: '00000000-0000-4000-8000-000000000005',
  an: '10000000-0000-4000-8000-000000000005',
  pt: '20000000-0000-4000-8000-000000000003',
  gymPkg: '30000000-0000-4000-8000-000000000001',
  ptPkg: '30000000-0000-4000-8000-000000000002',
};
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

const vnDay = (days: number): string =>
  new Date(Date.now() + 7 * 3600_000 + days * 86400_000).toISOString().slice(0, 10);

describe('Bảo lưu gói (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  const tokenFor = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;
  const admin = () => tokenFor({ sub: ID.admin, role: 'ADMIN', tv: 0 });
  const staff = () => tokenFor({ sub: ID.staff, role: 'STAFF', tv: 0 });
  const an = () => tokenFor({ sub: ID.anUser, role: 'MEMBER', tv: 0 });
  const http = () => request(app.getHttpServer());
  let orderNo = 0;

  /** Tạo một gói hội viên cho An, mặc định ACTIVE từ 5 ngày trước tới 25 ngày sau. */
  const makeSub = async (
    over: { packageId?: string; startsOn?: string; endsOn?: string; status?: 'ACTIVE' | 'EXPIRED' } = {},
  ) => {
    const packageId = over.packageId ?? ID.gymPkg;
    const isPt = packageId === ID.ptPkg;
    const order = await prisma.order.create({
      data: {
        memberId: ID.an,
        packageId,
        priceSnapshot: 1,
        durationValueSnapshot: 1,
        durationUnitSnapshot: 'MONTH',
        totalSessionsSnapshot: isPt ? 10 : null,
        sessionMinutesSnapshot: isPt ? 60 : null,
        includesClassSnapshot: false,
        startsOn: new Date(over.startsOn ?? vnDay(-5)),
        total: 1,
        status: 'PAID',
        expiresAt: new Date(),
        createdBy: ID.admin,
        receiptNo: `BL-TEST-${++orderNo}`,
      },
    });
    return prisma.subscription.create({
      data: {
        memberId: ID.an,
        packageId,
        orderId: order.id,
        packageName: isPt ? 'PT 10 buổi' : 'Gym 1 tháng',
        totalSessions: isPt ? 10 : null,
        sessionMinutes: isPt ? 60 : null,
        includesClass: false,
        startsOn: new Date(over.startsOn ?? vnDay(-5)),
        endsOn: new Date(over.endsOn ?? vnDay(25)),
        status: over.status ?? 'ACTIVE',
      },
    });
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
        { id: ID.ptUser, phone: '0900000021', fullName: 'Lê Minh Cường', role: 'TRAINER' },
        { id: ID.anUser, phone: '0901234567', fullName: 'Nguyễn Văn An', role: 'MEMBER' },
      ],
    });
    await prisma.member.create({
      data: { id: ID.an, userId: ID.anUser, memberCode: 'HV000001', qrToken: 'qr-an' },
    });
    await prisma.trainer.create({ data: { id: ID.pt, userId: ID.ptUser } });
    await prisma.package.createMany({
      data: [
        {
          id: ID.gymPkg,
          name: 'Gym 1 tháng',
          type: 'GYM',
          price: 300000,
          durationValue: 1,
          durationUnit: 'MONTH',
        },
        {
          id: ID.ptPkg,
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC11 POST /subscriptions/{id}/freeze', () => {
    it('Staff bảo lưu 14 ngày: 200, gói FROZEN, có freeze, thông báo cho hội viên, ghi audit', async () => {
      const sub = await makeSub();
      const res = await http()
        .post(`/api/v1/subscriptions/${sub.id}/freeze`)
        .set('Authorization', staff())
        .send({ days: 14, reason: 'Đi công tác' })
        .expect(200);
      expect(res.body).toMatchObject({
        id: sub.id,
        status: 'FROZEN',
        endsOn: vnDay(25),
        freeze: { frozenFrom: vnDay(0), frozenDays: 14, frozenUntil: vnDay(13), reason: 'Đi công tác' },
      });
      expect(
        await prisma.notification.count({ where: { userId: ID.anUser, type: 'SUBSCRIPTION_FROZEN' } }),
      ).toBe(1);
      const log = await prisma.auditLog.findFirstOrThrow({
        where: { targetId: sub.id, action: 'SUBSCRIPTION_FREEZE' },
      });
      expect(log).toMatchObject({ actorId: ID.staff, reason: 'Đi công tác' });

      // Gói đang bảo lưu: bảo lưu nữa thì 409 SUBSCRIPTION_NOT_ACTIVE
      const again = await http()
        .post(`/api/v1/subscriptions/${sub.id}/freeze`)
        .set('Authorization', admin())
        .send({ days: 3, reason: 'x' })
        .expect(409);
      expect(again.body.error.code).toBe('SUBSCRIPTION_NOT_ACTIVE');
    });

    it('hội viên tự bảo lưu: 403; không có: 404; days 31 hoặc thiếu reason: 400', async () => {
      const sub = await makeSub();
      await http()
        .post(`/api/v1/subscriptions/${sub.id}/freeze`)
        .set('Authorization', an())
        .send({ days: 5, reason: 'x' })
        .expect(403);
      await http()
        .post(`/api/v1/subscriptions/${UNKNOWN_ID}/freeze`)
        .set('Authorization', staff())
        .send({ days: 5, reason: 'x' })
        .expect(404);
      await http()
        .post(`/api/v1/subscriptions/${sub.id}/freeze`)
        .set('Authorization', staff())
        .send({ days: 31, reason: 'x' })
        .expect(400);
      await http()
        .post(`/api/v1/subscriptions/${sub.id}/freeze`)
        .set('Authorization', staff())
        .send({ days: 5 })
        .expect(400);
    });

    it('gói đã hết hạn hoặc chưa tới ngày bắt đầu: 409 SUBSCRIPTION_NOT_ACTIVE', async () => {
      const expired = await makeSub({ startsOn: vnDay(-40), endsOn: vnDay(-10), status: 'EXPIRED' });
      const future = await makeSub({ startsOn: vnDay(10), endsOn: vnDay(40) });
      for (const s of [expired, future]) {
        const res = await http()
          .post(`/api/v1/subscriptions/${s.id}/freeze`)
          .set('Authorization', staff())
          .send({ days: 5, reason: 'x' })
          .expect(409);
        expect(res.body.error.code).toBe('SUBSCRIPTION_NOT_ACTIVE');
      }
    });

    it('gói PT còn lịch sắp tới: 409 FREEZE_BLOCKED_BY_APPOINTMENTS kèm appointmentIds', async () => {
      const sub = await makeSub({ packageId: ID.ptPkg });
      const start = new Date(Date.now() + 2 * 86400_000);
      const appt = await prisma.appointment.create({
        data: {
          memberId: ID.an,
          subscriptionId: sub.id,
          trainerId: ID.pt,
          status: 'PENDING',
          startsAt: start,
          endsAt: new Date(start.getTime() + 3600_000),
        },
      });
      const res = await http()
        .post(`/api/v1/subscriptions/${sub.id}/freeze`)
        .set('Authorization', staff())
        .send({ days: 5, reason: 'x' })
        .expect(409);
      expect(res.body.error).toMatchObject({
        code: 'FREEZE_BLOCKED_BY_APPOINTMENTS',
        details: { appointmentIds: [appt.id] },
      });
    });

    it('đã bảo lưu 1 lần rồi mở lại: bảo lưu lần 2 thì 409 FREEZE_LIMIT_REACHED', async () => {
      const sub = await makeSub();
      await http()
        .post(`/api/v1/subscriptions/${sub.id}/freeze`)
        .set('Authorization', staff())
        .send({ days: 5, reason: 'x' })
        .expect(200);
      await http().post(`/api/v1/subscriptions/${sub.id}/unfreeze`).set('Authorization', staff()).expect(200);
      const res = await http()
        .post(`/api/v1/subscriptions/${sub.id}/freeze`)
        .set('Authorization', staff())
        .send({ days: 5, reason: 'x' })
        .expect(409);
      expect(res.body.error.code).toBe('FREEZE_LIMIT_REACHED');
    });
  });

  describe('UC11 POST /subscriptions/{id}/unfreeze', () => {
    it('mở lại sớm: cộng số ngày thực tế vào endsOn (Q20b), thông báo, audit', async () => {
      // Bảo lưu từ 3 ngày trước, đăng ký 10 ngày; mở hôm nay = thực tế 4 ngày (tính cả hai đầu)
      const sub = await makeSub();
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'FROZEN', frozenFrom: new Date(vnDay(-3)), frozenDays: 10, freezeReason: 'Ốm' },
      });
      const res = await http()
        .post(`/api/v1/subscriptions/${sub.id}/unfreeze`)
        .set('Authorization', admin())
        .expect(200);
      expect(res.body).toMatchObject({
        status: 'ACTIVE',
        endsOn: vnDay(29),
        freeze: { frozenFrom: vnDay(-3), frozenDays: 4, frozenUntil: vnDay(0), reason: 'Ốm' },
      });
      expect(
        await prisma.notification.count({ where: { targetId: sub.id, type: 'SUBSCRIPTION_UNFROZEN' } }),
      ).toBe(1);
      expect(
        await prisma.auditLog.count({ where: { targetId: sub.id, action: 'SUBSCRIPTION_UNFREEZE' } }),
      ).toBe(1);
    });

    it('gói không đang bảo lưu: 409 SUBSCRIPTION_NOT_FROZEN; hội viên: 403', async () => {
      const sub = await makeSub();
      const res = await http()
        .post(`/api/v1/subscriptions/${sub.id}/unfreeze`)
        .set('Authorization', staff())
        .expect(409);
      expect(res.body.error.code).toBe('SUBSCRIPTION_NOT_FROZEN');
      await http().post(`/api/v1/subscriptions/${sub.id}/unfreeze`).set('Authorization', an()).expect(403);
    });

    it('hai Staff cùng mở lại một lúc: chỉ cộng ngày một lần', async () => {
      const sub = await makeSub();
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'FROZEN', frozenFrom: new Date(vnDay(-1)), frozenDays: 5, freezeReason: 'x' },
      });
      const results = await Promise.all([
        http().post(`/api/v1/subscriptions/${sub.id}/unfreeze`).set('Authorization', staff()),
        http().post(`/api/v1/subscriptions/${sub.id}/unfreeze`).set('Authorization', admin()),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      const after = await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id } });
      expect(after.endsOn.toISOString().slice(0, 10)).toBe(vnDay(27));
    });

    it('job: hết kỳ bảo lưu thì tự mở lại, cộng đủ số ngày đã đăng ký', async () => {
      const sub = await makeSub();
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'FROZEN', frozenFrom: new Date(vnDay(-7)), frozenDays: 5, freezeReason: 'x' },
      });
      const reopened = await app.get(SubscriptionFreezeService).reopenExpiredFreezes();
      expect(reopened).toBeGreaterThanOrEqual(1);
      const after = await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id } });
      expect(after.status).toBe('ACTIVE');
      expect(after.endsOn.toISOString().slice(0, 10)).toBe(vnDay(30));
    });
  });
});
