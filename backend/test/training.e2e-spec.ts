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
  cuongUser: '00000000-0000-4000-8000-000000000003',
  hoaUser: '00000000-0000-4000-8000-000000000004',
  anUser: '00000000-0000-4000-8000-000000000005',
  binhUser: '00000000-0000-4000-8000-000000000006',
  an: '10000000-0000-4000-8000-000000000005',
  binh: '10000000-0000-4000-8000-000000000006',
  cuong: '20000000-0000-4000-8000-000000000003',
  hoa: '20000000-0000-4000-8000-000000000004',
  ptPkg: '30000000-0000-4000-8000-000000000001',
};
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

describe('Theo dõi tập (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  const tokenFor = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;
  const admin = () => tokenFor({ sub: ID.admin, role: 'ADMIN', tv: 0 });
  const staff = () => tokenFor({ sub: ID.staff, role: 'STAFF', tv: 0 });
  const cuong = () => tokenFor({ sub: ID.cuongUser, role: 'TRAINER', tv: 0 });
  const hoa = () => tokenFor({ sub: ID.hoaUser, role: 'TRAINER', tv: 0 });
  const an = () => tokenFor({ sub: ID.anUser, role: 'MEMBER', tv: 0 });
  const binh = () => tokenFor({ sub: ID.binhUser, role: 'MEMBER', tv: 0 });
  const http = () => request(app.getHttpServer());
  let planId = '';

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
        { id: ID.cuongUser, phone: '0900000021', fullName: 'Lê Minh Cường', role: 'TRAINER' },
        { id: ID.hoaUser, phone: '0900000022', fullName: 'Ngô Hoa', role: 'TRAINER' },
        { id: ID.anUser, phone: '0901234567', fullName: 'Nguyễn Văn An', role: 'MEMBER' },
        { id: ID.binhUser, phone: '0912345678', fullName: 'Trần Thị Bình', role: 'MEMBER' },
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
        { id: ID.cuong, userId: ID.cuongUser },
        { id: ID.hoa, userId: ID.hoaUser },
      ],
    });
    await prisma.package.create({
      data: {
        id: ID.ptPkg,
        name: 'PT 10 buổi',
        type: 'PT',
        price: 3000000,
        durationValue: 1,
        durationUnit: 'MONTH',
        totalSessions: 10,
        sessionMinutes: 60,
      },
    });
    const order = await prisma.order.create({
      data: {
        memberId: ID.an,
        packageId: ID.ptPkg,
        priceSnapshot: 1,
        durationValueSnapshot: 1,
        durationUnitSnapshot: 'MONTH',
        totalSessionsSnapshot: 10,
        sessionMinutesSnapshot: 60,
        includesClassSnapshot: false,
        startsOn: new Date('2026-11-01'),
        total: 1,
        status: 'PAID',
        expiresAt: new Date(),
        createdBy: ID.admin,
        receiptNo: 'BL-TEST-1',
      },
    });
    const sub = await prisma.subscription.create({
      data: {
        memberId: ID.an,
        packageId: ID.ptPkg,
        orderId: order.id,
        packageName: 'PT 10 buổi',
        totalSessions: 10,
        sessionMinutes: 60,
        includesClass: false,
        startsOn: new Date('2026-11-01'),
        endsOn: new Date('2026-12-31'),
      },
    });
    // Cường phụ trách An (có lịch COMPLETED); Hoa không phụ trách ai
    await prisma.appointment.create({
      data: {
        memberId: ID.an,
        subscriptionId: sub.id,
        trainerId: ID.cuong,
        status: 'COMPLETED',
        startsAt: new Date('2026-11-10T09:00:00+07:00'),
        endsAt: new Date('2026-11-10T10:00:00+07:00'),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC30 kế hoạch tập', () => {
    it('PT phụ trách lập kế hoạch: 201, progressPercent mặc định 0, bài tập đủ field', async () => {
      const res = await http()
        .post(`/api/v1/members/${ID.an}/training-plans`)
        .set('Authorization', cuong())
        .send({
          title: 'Giảm 5kg trong 8 tuần',
          exercises: [
            { name: 'Squat', sets: 4, reps: 10, weightKg: 50 },
            { name: 'Chạy bộ', durationMinutes: 20, note: 'Nhịp tim 130–150' },
          ],
        })
        .expect(201);
      expect(res.body).toMatchObject({
        memberId: ID.an,
        trainer: { id: ID.cuong, fullName: 'Lê Minh Cường', avatarUrl: null },
        title: 'Giảm 5kg trong 8 tuần',
        progressPercent: 0,
        exercises: [
          { name: 'Squat', sets: 4, reps: 10, weightKg: 50, durationMinutes: null, note: null },
          {
            name: 'Chạy bộ',
            sets: null,
            reps: null,
            weightKg: null,
            durationMinutes: 20,
            note: 'Nhịp tim 130–150',
          },
        ],
      });
      planId = res.body.id;
    });

    it('PT không phụ trách: 404; Admin, Staff, hội viên lập kế hoạch: 403; thiếu exercises: 400', async () => {
      const body = { title: 'X', exercises: [] };
      await http()
        .post(`/api/v1/members/${ID.an}/training-plans`)
        .set('Authorization', hoa())
        .send(body)
        .expect(404);
      await http()
        .post(`/api/v1/members/${ID.an}/training-plans`)
        .set('Authorization', admin())
        .send(body)
        .expect(403);
      await http()
        .post(`/api/v1/members/${ID.an}/training-plans`)
        .set('Authorization', staff())
        .send(body)
        .expect(403);
      await http()
        .post(`/api/v1/members/${ID.an}/training-plans`)
        .set('Authorization', an())
        .send(body)
        .expect(403);
      await http()
        .post(`/api/v1/members/${ID.an}/training-plans`)
        .set('Authorization', cuong())
        .send({ title: 'X' })
        .expect(400);
      await http()
        .post(`/api/v1/members/${UNKNOWN_ID}/training-plans`)
        .set('Authorization', cuong())
        .send(body)
        .expect(404);
    });

    it('xem kế hoạch: An, Cường, Admin 200; Bình xem của An, Hoa, Staff: 404 hoặc 403', async () => {
      for (const token of [an(), cuong(), admin()]) {
        const res = await http()
          .get(`/api/v1/members/${ID.an}/training-plans`)
          .set('Authorization', token)
          .expect(200);
        expect(res.body.meta.total).toBe(1);
      }
      await http().get(`/api/v1/members/${ID.an}/training-plans`).set('Authorization', binh()).expect(404);
      await http().get(`/api/v1/members/${ID.an}/training-plans`).set('Authorization', hoa()).expect(404);
      await http().get(`/api/v1/members/${ID.an}/training-plans`).set('Authorization', staff()).expect(403);
    });

    it('PATCH: PT lập kế hoạch sửa được, gửi exercises là thay cả danh sách; PT khác 404; body rỗng 400', async () => {
      const res = await http()
        .patch(`/api/v1/training-plans/${planId}`)
        .set('Authorization', cuong())
        .send({ progressPercent: 50, exercises: [{ name: 'Plank', durationMinutes: 2 }] })
        .expect(200);
      expect(res.body).toMatchObject({
        progressPercent: 50,
        exercises: [{ name: 'Plank', durationMinutes: 2 }],
      });
      expect(res.body.exercises).toHaveLength(1);
      await http()
        .patch(`/api/v1/training-plans/${planId}`)
        .set('Authorization', hoa())
        .send({ title: 'X' })
        .expect(404);
      await http()
        .patch(`/api/v1/training-plans/${planId}`)
        .set('Authorization', admin())
        .send({ title: 'X' })
        .expect(403);
      await http()
        .patch(`/api/v1/training-plans/${planId}`)
        .set('Authorization', cuong())
        .send({})
        .expect(400);
      await http()
        .patch(`/api/v1/training-plans/${planId}`)
        .set('Authorization', cuong())
        .send({ progressPercent: 101 })
        .expect(400);
    });
  });

  describe('UC29 ghi chú tập', () => {
    it('ghi chú gắn kế hoạch kèm tiến độ: 201, tiến độ kế hoạch cập nhật theo', async () => {
      const res = await http()
        .post(`/api/v1/members/${ID.an}/training-notes`)
        .set('Authorization', cuong())
        .send({ content: 'Đầu gối trái hơi đau, giảm tạ squat.', planId, progressPercent: 35 })
        .expect(201);
      expect(res.body).toMatchObject({
        memberId: ID.an,
        trainer: { id: ID.cuong },
        plan: { id: planId, title: 'Giảm 5kg trong 8 tuần' },
        progressPercent: 35,
      });
      const plan = await prisma.trainingPlan.findUniqueOrThrow({ where: { id: planId } });
      expect(plan.progressPercent).toBe(35);
    });

    it('ghi chú chung (không gắn kế hoạch): plan null; planId của hội viên khác: 400', async () => {
      const res = await http()
        .post(`/api/v1/members/${ID.an}/training-notes`)
        .set('Authorization', cuong())
        .send({ content: 'Hôm nay tập tốt.' })
        .expect(201);
      expect(res.body.plan).toBeNull();
      const otherPlan = await prisma.trainingPlan.create({
        data: { memberId: ID.binh, trainerId: ID.hoa, title: 'Của Bình' },
      });
      const bad = await http()
        .post(`/api/v1/members/${ID.an}/training-notes`)
        .set('Authorization', cuong())
        .send({ content: 'x', planId: otherPlan.id })
        .expect(400);
      expect(bad.body.error.details[0].field).toBe('planId');
    });

    it('xem ghi chú: mới nhất trước, lọc theo planId; hội viên khác 404; Admin ghi chú: 403', async () => {
      const all = await http()
        .get(`/api/v1/members/${ID.an}/training-notes`)
        .set('Authorization', an())
        .expect(200);
      expect(all.body.data.map((n: { content: string }) => n.content)).toEqual([
        'Hôm nay tập tốt.',
        'Đầu gối trái hơi đau, giảm tạ squat.',
      ]);
      const byPlan = await http()
        .get(`/api/v1/members/${ID.an}/training-notes?planId=${planId}`)
        .set('Authorization', admin())
        .expect(200);
      expect(byPlan.body.meta.total).toBe(1);
      await http().get(`/api/v1/members/${ID.an}/training-notes`).set('Authorization', binh()).expect(404);
      await http()
        .post(`/api/v1/members/${ID.an}/training-notes`)
        .set('Authorization', admin())
        .send({ content: 'x' })
        .expect(403);
      await http()
        .post(`/api/v1/members/${ID.an}/training-notes`)
        .set('Authorization', hoa())
        .send({ content: 'x' })
        .expect(404);
    });
  });
});
