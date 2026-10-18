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
  trainerUser: '00000000-0000-4000-8000-000000000003',
  otherTrainerUser: '00000000-0000-4000-8000-000000000004',
  anUser: '00000000-0000-4000-8000-000000000005',
  binhUser: '00000000-0000-4000-8000-000000000006',
  an: '10000000-0000-4000-8000-000000000005',
  binh: '10000000-0000-4000-8000-000000000006',
  trainer: '20000000-0000-4000-8000-000000000003',
  otherTrainer: '20000000-0000-4000-8000-000000000004',
  ptPackage: '30000000-0000-4000-8000-000000000001',
  ptOrder: '40000000-0000-4000-8000-000000000001',
  ptSub: '50000000-0000-4000-8000-000000000001',
};
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

describe('Hội viên (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  const tokenFor = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;
  const staff = () => tokenFor({ sub: ID.staff, role: 'STAFF', tv: 0 });
  const admin = () => tokenFor({ sub: ID.admin, role: 'ADMIN', tv: 0 });
  const trainer = () => tokenFor({ sub: ID.trainerUser, role: 'TRAINER', tv: 0 });
  const otherTrainer = () => tokenFor({ sub: ID.otherTrainerUser, role: 'TRAINER', tv: 0 });
  const member = () => tokenFor({ sub: ID.anUser, role: 'MEMBER', tv: 0 });
  const http = () => request(app.getHttpServer());

  /** Lịch PT của An với PT chính, mỗi lịch 1 giờ, cách nhau 1 ngày. */
  const appointment = (
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED',
    day: number,
  ) => ({
    subscriptionId: ID.ptSub,
    memberId: ID.an,
    trainerId: ID.trainer,
    status,
    startsAt: new Date(`2026-10-${String(day).padStart(2, '0')}T03:00:00Z`),
    endsAt: new Date(`2026-10-${String(day).padStart(2, '0')}T04:00:00Z`),
  });

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    jwt = moduleRef.get(JwtService);
    prisma = moduleRef.get(PrismaService);

    // TRUNCATE không chạy trigger chặn DELETE của audit_logs, nên xóa sạch được DB test
    await prisma.$executeRawUnsafe('TRUNCATE packages, audit_logs, users RESTART IDENTITY CASCADE');
    await prisma.user.createMany({
      data: [
        { id: ID.admin, phone: '0900000001', fullName: 'Admin', role: 'ADMIN' },
        { id: ID.staff, phone: '0900000011', fullName: 'Lễ tân', role: 'STAFF' },
        { id: ID.trainerUser, phone: '0900000021', fullName: 'PT Chính', role: 'TRAINER' },
        { id: ID.otherTrainerUser, phone: '0900000022', fullName: 'PT Khác', role: 'TRAINER' },
        {
          id: ID.anUser,
          phone: '0901234567',
          fullName: 'Nguyễn Văn An',
          role: 'MEMBER',
          email: 'an@gym.local',
          passwordHash: 'x',
          createdAt: new Date('2026-10-01T01:00:00Z'),
        },
        {
          id: ID.binhUser,
          phone: '0912345678',
          fullName: 'Trần Thị Bình',
          role: 'MEMBER',
          createdAt: new Date('2026-10-05T01:00:00Z'),
        },
      ],
    });
    await prisma.member.createMany({
      data: [
        { id: ID.an, userId: ID.anUser, memberCode: 'HV000001', qrToken: 'qr-an' },
        { id: ID.binh, userId: ID.binhUser, memberCode: 'HV000002', qrToken: 'qr-binh' },
      ],
    });
    await prisma.trainer.createMany({
      data: [
        { id: ID.trainer, userId: ID.trainerUser },
        { id: ID.otherTrainer, userId: ID.otherTrainerUser },
      ],
    });
    await prisma.package.create({
      data: {
        id: ID.ptPackage,
        name: 'PT 12 buổi',
        type: 'PT',
        price: 3600000,
        durationValue: 2,
        durationUnit: 'MONTH',
        totalSessions: 12,
        sessionMinutes: 60,
      },
    });
    await prisma.order.create({
      data: {
        id: ID.ptOrder,
        memberId: ID.an,
        packageId: ID.ptPackage,
        priceSnapshot: 3600000,
        durationValueSnapshot: 2,
        durationUnitSnapshot: 'MONTH',
        totalSessionsSnapshot: 12,
        sessionMinutesSnapshot: 60,
        includesClassSnapshot: true,
        startsOn: new Date('2026-10-01'),
        total: 3600000,
        status: 'PAID',
        expiresAt: new Date('2026-10-01T01:30:00Z'),
        createdBy: ID.staff,
      },
    });
    await prisma.subscription.create({
      data: {
        id: ID.ptSub,
        memberId: ID.an,
        packageId: ID.ptPackage,
        orderId: ID.ptOrder,
        packageName: 'PT 12 buổi',
        totalSessions: 12,
        sessionMinutes: 60,
        includesClass: true,
        startsOn: new Date('2026-10-01'),
        endsOn: new Date('2026-11-30'),
      },
    });
    await prisma.appointment.createMany({
      data: [
        appointment('COMPLETED', 2),
        appointment('COMPLETED', 3),
        appointment('NO_SHOW', 4),
        appointment('CONFIRMED', 20),
        appointment('PENDING', 21),
        appointment('CANCELLED', 22),
      ],
    });
    await prisma.checkIn.create({
      data: {
        memberId: ID.an,
        subscriptionId: ID.ptSub,
        method: 'QR',
        checkedInAt: new Date('2026-10-08T11:05:00Z'),
        checkedInBy: ID.staff,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC19 GET /members', () => {
    it('Staff thấy mọi hội viên, tạo mới nhất trước, không có qrToken', async () => {
      const res = await http().get('/api/v1/members').set('Authorization', staff()).expect(200);
      expect(res.body.data.map((m: { memberCode: string }) => m.memberCode)).toEqual([
        'HV000002',
        'HV000001',
      ]);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 2, totalPages: 1 });
      expect(res.body.data[1]).toEqual({
        id: ID.an,
        userId: ID.anUser,
        memberCode: 'HV000001',
        fullName: 'Nguyễn Văn An',
        phone: '0901234567',
        email: 'an@gym.local',
        dob: null,
        avatarUrl: null,
        accountStatus: 'ACTIVE',
        accountActivated: true,
        hasActiveSubscription: true,
        createdAt: '2026-10-01T08:00:00+07:00',
      });
      expect(res.body.data[0]).toMatchObject({ accountActivated: false, hasActiveSubscription: false });
    });

    it('tìm tên không dấu, theo SĐT, theo mã', async () => {
      const byName = await http()
        .get('/api/v1/members')
        .query({ q: 'nguyen van an' })
        .set('Authorization', staff());
      expect(byName.body.data.map((m: { id: string }) => m.id)).toEqual([ID.an]);

      const byPhone = await http().get('/api/v1/members').query({ q: '0912' }).set('Authorization', staff());
      expect(byPhone.body.data.map((m: { id: string }) => m.id)).toEqual([ID.binh]);

      const byCode = await http()
        .get('/api/v1/members')
        .query({ q: 'hv000001' })
        .set('Authorization', staff());
      expect(byCode.body.data.map((m: { id: string }) => m.id)).toEqual([ID.an]);
    });

    it('lọc hội viên (có gói ACTIVE) và khách hàng', async () => {
      const active = await http()
        .get('/api/v1/members')
        .query({ hasActiveSubscription: 'true' })
        .set('Authorization', admin());
      expect(active.body.data.map((m: { id: string }) => m.id)).toEqual([ID.an]);

      const guests = await http()
        .get('/api/v1/members')
        .query({ hasActiveSubscription: 'false' })
        .set('Authorization', admin());
      expect(guests.body.data.map((m: { id: string }) => m.id)).toEqual([ID.binh]);
    });

    it('PT chỉ thấy hội viên mình phụ trách (quyết định 16)', async () => {
      const mine = await http().get('/api/v1/members').set('Authorization', trainer()).expect(200);
      expect(mine.body.data.map((m: { id: string }) => m.id)).toEqual([ID.an]);

      const other = await http().get('/api/v1/members').set('Authorization', otherTrainer()).expect(200);
      expect(other.body.data).toEqual([]);
    });

    it('hội viên gọi thì FORBIDDEN; tham số sai thì VALIDATION_ERROR', async () => {
      const res = await http().get('/api/v1/members').set('Authorization', member()).expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN');

      const bad = await http()
        .get('/api/v1/members')
        .query({ hasActiveSubscription: 'yes' })
        .set('Authorization', staff())
        .expect(400);
      expect(bad.body.error.details[0].field).toBe('hasActiveSubscription');
    });
  });

  describe('UC19 GET /members/{id}', () => {
    it('kèm gói và số buổi tính từ lịch, kèm lượt đang trong phòng', async () => {
      const res = await http().get(`/api/v1/members/${ID.an}`).set('Authorization', staff()).expect(200);
      expect(res.body.subscriptions).toEqual([
        {
          id: ID.ptSub,
          packageName: 'PT 12 buổi',
          type: 'PT',
          startsOn: '2026-10-01',
          endsOn: '2026-11-30',
          status: 'ACTIVE',
          includesClass: true,
          sessions: { total: 12, used: 3, held: 2, remaining: 9, bookable: 7 },
        },
      ]);
      expect(res.body.currentCheckIn).toEqual({
        id: expect.any(String),
        checkedInAt: '2026-10-08T18:05:00+07:00',
      });
      expect(res.body).not.toHaveProperty('qrToken');
    });

    it('PT không phụ trách thì NOT_FOUND; không có hội viên thì NOT_FOUND', async () => {
      await http().get(`/api/v1/members/${ID.an}`).set('Authorization', trainer()).expect(200);
      const res = await http()
        .get(`/api/v1/members/${ID.an}`)
        .set('Authorization', otherTrainer())
        .expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
      await http().get(`/api/v1/members/${UNKNOWN_ID}`).set('Authorization', staff()).expect(404);
    });
  });

  describe('UC20 POST /members', () => {
    it('Staff tạo hồ sơ chưa có mật khẩu, mã HV tăng dần', async () => {
      const res = await http()
        .post('/api/v1/members')
        .set('Authorization', staff())
        .send({ fullName: 'Lê Văn Cường', phone: '0987654321', email: null, dob: '2000-01-15' })
        .expect(201);
      expect(res.body).toMatchObject({
        memberCode: 'HV000003',
        fullName: 'Lê Văn Cường',
        phone: '0987654321',
        email: null,
        dob: '2000-01-15',
        accountActivated: false,
        hasActiveSubscription: false,
        subscriptions: [],
        currentCheckIn: null,
      });
      const user = await prisma.user.findUniqueOrThrow({ where: { phone: '0987654321' } });
      expect(user).toMatchObject({ role: 'MEMBER', passwordHash: null });
    });

    it('hai Staff tạo cùng lúc không sinh trùng mã', async () => {
      const results = await Promise.all(
        ['0977000001', '0977000002', '0977000003'].map((phone) =>
          http().post('/api/v1/members').set('Authorization', staff()).send({ fullName: 'Khách', phone }),
        ),
      );
      expect(results.map((r) => r.status)).toEqual([201, 201, 201]);
      const codes = results.map((r) => r.body.memberCode);
      expect(new Set(codes).size).toBe(3);
    });

    it('hai Staff tạo cùng SĐT cùng lúc: một thành công, một PHONE_DUPLICATED kèm memberId', async () => {
      const results = await Promise.all(
        [1, 2].map(() =>
          http()
            .post('/api/v1/members')
            .set('Authorization', staff())
            .send({ fullName: 'Khách', phone: '0944000000' }),
        ),
      );
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      const created = results.find((r) => r.status === 201)!;
      const rejected = results.find((r) => r.status === 409)!;
      expect(rejected.body.error).toMatchObject({
        code: 'PHONE_DUPLICATED',
        details: { memberId: created.body.id },
      });
    });

    it('SĐT đã là hội viên thì PHONE_DUPLICATED kèm memberId; email trùng thì EMAIL_DUPLICATED', async () => {
      const phone = await http()
        .post('/api/v1/members')
        .set('Authorization', staff())
        .send({ fullName: 'Trùng', phone: '0901234567' })
        .expect(409);
      expect(phone.body.error).toMatchObject({ code: 'PHONE_DUPLICATED', details: { memberId: ID.an } });

      const email = await http()
        .post('/api/v1/members')
        .set('Authorization', staff())
        .send({ fullName: 'Trùng', phone: '0966000000', email: 'an@gym.local' })
        .expect(409);
      expect(email.body.error.code).toBe('EMAIL_DUPLICATED');
    });

    it('SĐT của nhân viên thì PHONE_DUPLICATED không kèm memberId', async () => {
      const res = await http()
        .post('/api/v1/members')
        .set('Authorization', staff())
        .send({ fullName: 'Trùng', phone: '0900000021' })
        .expect(409);
      expect(res.body.error).toMatchObject({ code: 'PHONE_DUPLICATED', details: null });
    });

    it('PT tạo thì FORBIDDEN; SĐT sai dạng thì VALIDATION_ERROR', async () => {
      await http()
        .post('/api/v1/members')
        .set('Authorization', trainer())
        .send({ fullName: 'X', phone: '0955000000' })
        .expect(403);
      const res = await http()
        .post('/api/v1/members')
        .set('Authorization', staff())
        .send({ fullName: 'X', phone: '12345', dob: '15/01/2000' })
        .expect(400);
      expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(['phone', 'dob']);
    });
  });

  describe('UC20 PATCH /members/{id}', () => {
    it('Staff đổi SĐT và xóa email', async () => {
      const res = await http()
        .patch(`/api/v1/members/${ID.binh}`)
        .set('Authorization', staff())
        .send({ phone: '0912000000', email: null })
        .expect(200);
      expect(res.body).toMatchObject({
        id: ID.binh,
        phone: '0912000000',
        email: null,
        fullName: 'Trần Thị Bình',
      });
    });

    it('gửi lại đúng SĐT của chính mình thì không báo trùng', async () => {
      await http()
        .patch(`/api/v1/members/${ID.an}`)
        .set('Authorization', staff())
        .send({ phone: '0901234567', fullName: 'Nguyễn Văn An' })
        .expect(200);
    });

    it('đổi sang SĐT người khác thì PHONE_DUPLICATED', async () => {
      const res = await http()
        .patch(`/api/v1/members/${ID.binh}`)
        .set('Authorization', staff())
        .send({ phone: '0901234567' })
        .expect(409);
      expect(res.body.error).toMatchObject({ code: 'PHONE_DUPLICATED', details: { memberId: ID.an } });
    });

    it('body rỗng hoặc fullName null thì VALIDATION_ERROR', async () => {
      await http().patch(`/api/v1/members/${ID.binh}`).set('Authorization', staff()).send({}).expect(400);
      const res = await http()
        .patch(`/api/v1/members/${ID.binh}`)
        .set('Authorization', staff())
        .send({ fullName: null })
        .expect(400);
      expect(res.body.error.details[0].field).toBe('fullName');
    });

    it('PT sửa thì FORBIDDEN; không có hội viên thì NOT_FOUND', async () => {
      await http()
        .patch(`/api/v1/members/${ID.an}`)
        .set('Authorization', trainer())
        .send({ fullName: 'X' })
        .expect(403);
      await http()
        .patch(`/api/v1/members/${UNKNOWN_ID}`)
        .set('Authorization', admin())
        .send({ fullName: 'X' })
        .expect(404);
    });
  });
});
