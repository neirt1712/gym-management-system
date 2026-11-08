import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { AccessTokenPayload } from '../src/common/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';

/*
 * Test tích hợp các nhóm nợ tuần 1–5: tài khoản, PT + khung giờ, lịch PT, check-in, thông báo, ảnh đại diện.
 * DB riêng `gym_test` (cách chuẩn bị: xem đầu test/packages.e2e-spec.ts); test xóa sạch dữ liệu trước mỗi ca.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://gym:gym@localhost:5432/gym_test?schema=public';
if (!new URL(TEST_DATABASE_URL).pathname.endsWith('_test')) {
  throw new Error('TEST_DATABASE_URL phải trỏ tới DB tên *_test');
}
process.env.DATABASE_URL = TEST_DATABASE_URL;

const ID = {
  admin: '00000000-0000-4000-8000-000000000001',
  staff: '00000000-0000-4000-8000-000000000002',
  trainerUser: '00000000-0000-4000-8000-000000000003',
  otherTrainerUser: '00000000-0000-4000-8000-000000000004',
  anUser: '00000000-0000-4000-8000-000000000005',
  binhUser: '00000000-0000-4000-8000-000000000006',
  trainer: '20000000-0000-4000-8000-000000000003',
  otherTrainer: '20000000-0000-4000-8000-000000000004',
  an: '10000000-0000-4000-8000-000000000005',
  binh: '10000000-0000-4000-8000-000000000006',
  ptPackage: '30000000-0000-4000-8000-000000000001',
  gymPackage: '30000000-0000-4000-8000-000000000002',
  ptOrder: '40000000-0000-4000-8000-000000000001',
  gymOrder: '40000000-0000-4000-8000-000000000002',
  ptSub: '50000000-0000-4000-8000-000000000001',
  gymSub: '50000000-0000-4000-8000-000000000002',
};
const DAY = 24 * 60 * 60 * 1000;
const dateOnly = (offsetDays: number) =>
  new Date(`${new Date(Date.now() + 7 * 3600_000 + offsetDays * DAY).toISOString().slice(0, 10)}T00:00:00Z`);
/** 18:00 giờ VN của ngày cách hôm nay `offsetDays` ngày. */
const at18 = (offsetDays: number) =>
  `${new Date(Date.now() + 7 * 3600_000 + offsetDays * DAY).toISOString().slice(0, 10)}T18:00:00+07:00`;

describe('Việc nợ tuần 1–5 (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  const bearer = (sub: string, role: AccessTokenPayload['role']) =>
    `Bearer ${jwt.sign({ sub, role, tv: 0 })}`;
  const admin = () => bearer(ID.admin, 'ADMIN');
  const staff = () => bearer(ID.staff, 'STAFF');
  const trainer = () => bearer(ID.trainerUser, 'TRAINER');
  const otherTrainer = () => bearer(ID.otherTrainerUser, 'TRAINER');
  const an = () => bearer(ID.anUser, 'MEMBER');
  const binh = () => bearer(ID.binhUser, 'MEMBER');
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    // Mở cổng một lần: để supertest tự mở rồi đóng server giữa các request thì có lúc request mới tới
    // đúng lúc server vừa đóng (lỗi "reading 'address'" trên CI)
    await app.listen(0, '127.0.0.1');
    jwt = moduleRef.get(JwtService);
    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE packages, audit_logs, users RESTART IDENTITY CASCADE');
    await prisma.user.createMany({
      data: [
        { id: ID.admin, phone: '0900000001', fullName: 'Admin', role: 'ADMIN' },
        { id: ID.staff, phone: '0900000002', fullName: 'Staff', role: 'STAFF' },
        { id: ID.trainerUser, phone: '0900000003', fullName: 'PT Tăng Cơ', role: 'TRAINER' },
        { id: ID.otherTrainerUser, phone: '0900000004', fullName: 'PT Yoga', role: 'TRAINER' },
        { id: ID.anUser, phone: '0900000005', fullName: 'Nguyễn Văn An', role: 'MEMBER' },
        { id: ID.binhUser, phone: '0900000006', fullName: 'Trần Bình', role: 'MEMBER' },
      ],
    });
    await prisma.trainer.createMany({
      data: [
        { id: ID.trainer, userId: ID.trainerUser, specialties: ['Tăng cơ'] },
        { id: ID.otherTrainer, userId: ID.otherTrainerUser, specialties: ['Yoga'] },
      ],
    });
    await prisma.member.createMany({
      data: [
        { id: ID.an, userId: ID.anUser, memberCode: 'HV000005', qrToken: 'qr-an' },
        { id: ID.binh, userId: ID.binhUser, memberCode: 'HV000006', qrToken: 'qr-binh' },
      ],
    });
    await prisma.package.createMany({
      data: [
        {
          id: ID.ptPackage,
          name: 'PT 2 buổi',
          type: 'PT',
          price: 1000000,
          durationValue: 1,
          durationUnit: 'MONTH',
          totalSessions: 2,
          sessionMinutes: 60,
        },
        {
          id: ID.gymPackage,
          name: 'Gym 1 tháng',
          type: 'GYM',
          price: 300000,
          durationValue: 1,
          durationUnit: 'MONTH',
        },
      ],
    });
    const order = (id: string, packageId: string, memberId: string) => ({
      id,
      memberId,
      packageId,
      priceSnapshot: 1,
      durationValueSnapshot: 1,
      durationUnitSnapshot: 'MONTH' as const,
      includesClassSnapshot: false,
      startsOn: dateOnly(-1),
      total: 1,
      status: 'PAID' as const,
      expiresAt: new Date(),
      createdBy: ID.staff,
    });
    await prisma.order.createMany({
      data: [order(ID.ptOrder, ID.ptPackage, ID.an), order(ID.gymOrder, ID.gymPackage, ID.binh)],
    });
    await prisma.subscription.createMany({
      data: [
        {
          id: ID.ptSub,
          memberId: ID.an,
          packageId: ID.ptPackage,
          orderId: ID.ptOrder,
          packageName: 'PT 2 buổi',
          totalSessions: 2,
          sessionMinutes: 60,
          includesClass: false,
          startsOn: dateOnly(-1),
          endsOn: dateOnly(29),
        },
        {
          id: ID.gymSub,
          memberId: ID.binh,
          packageId: ID.gymPackage,
          orderId: ID.gymOrder,
          packageName: 'Gym 1 tháng',
          includesClass: false,
          startsOn: dateOnly(-1),
          endsOn: dateOnly(5),
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const book = (startsAt = at18(2), token = an()) =>
    http()
      .post('/api/v1/appointments')
      .set('Authorization', token)
      .send({ subscriptionId: ID.ptSub, trainerId: ID.trainer, startsAt });

  describe('UC31–UC35 tài khoản', () => {
    it('Admin tạo PT kèm hồ sơ; vai trò khác 403', async () => {
      const body = {
        role: 'TRAINER',
        fullName: 'PT Mới',
        phone: '0900000099',
        password: 'matkhau123',
        trainer: { specialties: ['Cardio'] },
      };
      await http().post('/api/v1/users').set('Authorization', staff()).send(body).expect(403);
      const res = await http().post('/api/v1/users').set('Authorization', admin()).send(body).expect(201);
      expect(res.body).toMatchObject({ role: 'TRAINER', trainer: { specialties: ['Cardio'] } });
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('khóa tài khoản thu hồi phiên, ghi audit; không tự khóa mình', async () => {
      await http()
        .patch(`/api/v1/users/${ID.staff}/status`)
        .set('Authorization', admin())
        .send({ status: 'LOCKED', reason: 'Nghỉ việc' })
        .expect(200);
      await http().get('/api/v1/me').set('Authorization', staff()).expect(401);
      expect(await prisma.auditLog.count({ where: { action: 'USER_LOCK' } })).toBe(1);
      await http()
        .patch(`/api/v1/users/${ID.admin}/status`)
        .set('Authorization', admin())
        .send({ status: 'LOCKED', reason: 'x' })
        .expect(403);
    });

    it('đổi vai trò MEMBER hoặc PT còn lịch tương lai thì ROLE_CHANGE_NOT_ALLOWED', async () => {
      const member = await http()
        .patch(`/api/v1/users/${ID.anUser}/role`)
        .set('Authorization', admin())
        .send({ role: 'STAFF', reason: 'x' })
        .expect(422);
      expect(member.body.error.code).toBe('ROLE_CHANGE_NOT_ALLOWED');
      await book().expect(201);
      await http()
        .patch(`/api/v1/users/${ID.trainerUser}/role`)
        .set('Authorization', admin())
        .send({ role: 'STAFF', reason: 'x' })
        .expect(422);
    });
  });

  describe('UC21, UC22 PT và khung giờ', () => {
    it('danh sách công khai chỉ có PT ACTIVE, không có SĐT', async () => {
      await prisma.trainer.update({ where: { id: ID.otherTrainer }, data: { status: 'INACTIVE' } });
      const res = await http().get('/api/v1/trainers').expect(200);
      expect(res.body.data.map((t: { id: string }) => t.id)).toEqual([ID.trainer]);
      expect(res.body.data[0]).not.toHaveProperty('phone');
    });

    it('PT thay khung giờ của mình; khoảng chồng nhau thì VALIDATION_ERROR; PT khác 404', async () => {
      const from = at18(1).slice(0, 10);
      const to = at18(7).slice(0, 10);
      const slots = [{ startsAt: at18(1), endsAt: at18(1).replace('T18:', 'T21:') }];
      const res = await http()
        .put(`/api/v1/trainers/${ID.trainer}/availability`)
        .set('Authorization', trainer())
        .send({ from, to, slots })
        .expect(200);
      expect(res.body.slots).toHaveLength(1);

      const overlap = await http()
        .put(`/api/v1/trainers/${ID.trainer}/availability`)
        .set('Authorization', trainer())
        .send({
          from,
          to,
          slots: [
            ...slots,
            { startsAt: at18(1).replace('T18:', 'T19:'), endsAt: at18(1).replace('T18:', 'T20:') },
          ],
        })
        .expect(400);
      expect(overlap.body.error.details[0].field).toBe('slots[1].startsAt');

      await http()
        .put(`/api/v1/trainers/${ID.trainer}/availability`)
        .set('Authorization', otherTrainer())
        .send({ from, to, slots })
        .expect(404);
    });
  });

  describe('UC23–UC27 lịch PT', () => {
    it('tạo lịch PENDING chờ PT, PT có thông báo; PT đồng ý thì CONFIRMED, version tăng', async () => {
      const created = await book().expect(201);
      expect(created.body).toMatchObject({
        status: 'PENDING',
        awaitingRole: 'TRAINER',
        version: 1,
        allowedActions: [],
      });
      expect(await prisma.notification.count({ where: { userId: ID.trainerUser } })).toBe(1);

      const detail = await http()
        .get(`/api/v1/appointments/${created.body.id}`)
        .set('Authorization', trainer())
        .expect(200);
      expect(detail.body.allowedActions).toEqual(['ACCEPT', 'REJECT', 'COUNTER']);

      const accepted = await http()
        .post(`/api/v1/appointments/${created.body.id}/accept`)
        .set('Authorization', trainer())
        .send({ expectedVersion: 1 })
        .expect(200);
      expect(accepted.body).toMatchObject({ status: 'CONFIRMED', version: 2, awaitingRole: null });
    });

    it('expectedVersion cũ thì STALE_VERSION; bên không được hỏi thì FORBIDDEN', async () => {
      const created = await book().expect(201);
      const stale = await http()
        .post(`/api/v1/appointments/${created.body.id}/accept`)
        .set('Authorization', trainer())
        .send({ expectedVersion: 9 })
        .expect(409);
      expect(stale.body.error.code).toBe('STALE_VERSION');
      await http()
        .post(`/api/v1/appointments/${created.body.id}/accept`)
        .set('Authorization', an())
        .send({ expectedVersion: 1 })
        .expect(403);
    });

    it('PT đề xuất giờ khác (COUNTER) thì lượt trả lời chuyển sang hội viên', async () => {
      const created = await book().expect(201);
      const countered = await http()
        .post(`/api/v1/appointments/${created.body.id}/proposals`)
        .set('Authorization', trainer())
        .send({ kind: 'COUNTER', startsAt: at18(3), expectedVersion: 1 })
        .expect(201);
      expect(countered.body).toMatchObject({ awaitingRole: 'MEMBER', version: 2 });
      expect(countered.body.proposals.map((p: { status: string }) => p.status)).toEqual([
        'SUPERSEDED',
        'OPEN',
      ]);
    });

    it('hai lịch cùng giờ: đồng ý cái thứ hai thì SCHEDULE_CONFLICT', async () => {
      const first = await book(at18(2), an()).expect(201);
      await http()
        .post(`/api/v1/appointments/${first.body.id}/accept`)
        .set('Authorization', trainer())
        .send({ expectedVersion: 1 })
        .expect(200);
      const second = await book(at18(2).replace('T18:00', 'T18:30'), an()).expect(409);
      expect(second.body.error.code).toBe('SCHEDULE_CONFLICT');
    });

    it('hết buổi có thể đặt thì NO_SESSIONS_AVAILABLE', async () => {
      await book(at18(2)).expect(201);
      await book(at18(3)).expect(201);
      const res = await book(at18(4)).expect(422);
      expect(res.body.error.code).toBe('NO_SESSIONS_AVAILABLE');
    });

    it('giờ ngoài thời hạn gói thì OUTSIDE_SUBSCRIPTION_PERIOD', async () => {
      const res = await book(at18(40)).expect(422);
      expect(res.body.error.code).toBe('OUTSIDE_SUBSCRIPTION_PERIOD');
    });

    it('xác nhận buổi chưa kết thúc thì SESSION_NOT_ENDED', async () => {
      const created = await book().expect(201);
      await http()
        .post(`/api/v1/appointments/${created.body.id}/accept`)
        .set('Authorization', trainer())
        .send({ expectedVersion: 1 })
        .expect(200);
      const res = await http()
        .post(`/api/v1/appointments/${created.body.id}/complete`)
        .set('Authorization', trainer())
        .send({ result: 'COMPLETED', expectedVersion: 2 })
        .expect(422);
      expect(res.body.error.code).toBe('SESSION_NOT_ENDED');
    });

    it('hội viên khác không xem được lịch (404)', async () => {
      const created = await book().expect(201);
      await http().get(`/api/v1/appointments/${created.body.id}`).set('Authorization', binh()).expect(404);
    });
  });

  describe('UC16–UC18 check-in', () => {
    it('check-in bằng SĐT, gói còn ≤ 7 ngày thì expiringSoon; lần hai ALREADY_CHECKED_IN', async () => {
      const res = await http()
        .post('/api/v1/check-ins')
        .set('Authorization', staff())
        .send({ phone: '0900000006' })
        .expect(201);
      expect(res.body).toMatchObject({ method: 'PHONE', expiringSoon: true, checkedOutAt: null });
      const again = await http()
        .post('/api/v1/check-ins')
        .set('Authorization', staff())
        .send({ qrToken: 'qr-binh' })
        .expect(409);
      expect(again.body.error).toMatchObject({
        code: 'ALREADY_CHECKED_IN',
        details: { checkInId: res.body.id },
      });
    });

    it('QR sai thì INVALID_QR; không có gói thì NO_ACTIVE_SUBSCRIPTION; gói PT vào được', async () => {
      const bad = await http()
        .post('/api/v1/check-ins')
        .set('Authorization', staff())
        .send({ qrToken: 'sai' })
        .expect(422);
      expect(bad.body.error.code).toBe('INVALID_QR');
      const pt = await http()
        .post('/api/v1/check-ins')
        .set('Authorization', staff())
        .send({ qrToken: 'qr-an' })
        .expect(201);
      expect(pt.body.subscription.id).toBe(ID.ptSub);
      await prisma.subscription.update({ where: { id: ID.gymSub }, data: { startsOn: dateOnly(3) } });
      const future = await http()
        .post('/api/v1/check-ins')
        .set('Authorization', staff())
        .send({ phone: '0900000006' })
        .expect(422);
      expect(future.body.error.code).toBe('NO_ACTIVE_SUBSCRIPTION');
    });

    it('check-out lặp vẫn 200; hội viên tự check-out là SELF; danh sách present', async () => {
      const res = await http()
        .post('/api/v1/check-ins')
        .set('Authorization', staff())
        .send({ phone: '0900000006' })
        .expect(201);
      const present = await http()
        .get('/api/v1/check-ins')
        .query({ present: 'true' })
        .set('Authorization', staff())
        .expect(200);
      expect(present.body.meta.total).toBe(1);
      const out = await http()
        .post(`/api/v1/check-ins/${res.body.id}/checkout`)
        .set('Authorization', binh())
        .expect(200);
      expect(out.body.checkoutType).toBe('SELF');
      await http()
        .post(`/api/v1/check-ins/${res.body.id}/checkout`)
        .set('Authorization', staff())
        .expect(200);
      await http().post(`/api/v1/check-ins/${res.body.id}/checkout`).set('Authorization', an()).expect(404);
    });
  });

  describe('UC42 thông báo', () => {
    it('chỉ thấy của mình, unreadCount; đánh dấu đã đọc; của người khác 404', async () => {
      const mine = await prisma.notification.create({
        data: { userId: ID.anUser, type: 'BROADCAST', title: 'A', body: 'a' },
      });
      await prisma.notification.create({
        data: { userId: ID.binhUser, type: 'BROADCAST', title: 'B', body: 'b' },
      });
      const list = await http().get('/api/v1/notifications').set('Authorization', an()).expect(200);
      expect(list.body.meta).toMatchObject({ total: 1, unreadCount: 1 });
      await http().patch(`/api/v1/notifications/${mine.id}/read`).set('Authorization', an()).expect(200);
      const after = await http().get('/api/v1/notifications').set('Authorization', an()).expect(200);
      expect(after.body.meta.unreadCount).toBe(0);
      await http().patch(`/api/v1/notifications/${mine.id}/read`).set('Authorization', binh()).expect(404);
    });
  });

  describe('UC05 ảnh đại diện', () => {
    it('nhận PNG, trả avatarUrl tải về được; file không phải ảnh thì INVALID_FILE', async () => {
      const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
      const res = await http()
        .post('/api/v1/uploads/avatar')
        .set('Authorization', an())
        .attach('file', png, 'a.png')
        .expect(201);
      expect(res.body.avatarUrl).toMatch(/^\/api\/v1\/uploads\/avatars\/.+\.png$/);
      await http().get(res.body.avatarUrl).expect(200);

      const bad = await http()
        .post('/api/v1/uploads/avatar')
        .set('Authorization', an())
        .attach('file', Buffer.from('hello'), 'a.txt')
        .expect(422);
      expect(bad.body.error.code).toBe('INVALID_FILE');
    });
  });
});
