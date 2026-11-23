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
  dungUser: '00000000-0000-4000-8000-000000000004',
  hoaUser: '00000000-0000-4000-8000-000000000008',
  anUser: '00000000-0000-4000-8000-000000000005',
  binhUser: '00000000-0000-4000-8000-000000000006',
  chiUser: '00000000-0000-4000-8000-000000000007',
  an: '10000000-0000-4000-8000-000000000005',
  binh: '10000000-0000-4000-8000-000000000006',
  chi: '10000000-0000-4000-8000-000000000007',
  cuong: '20000000-0000-4000-8000-000000000003',
  dung: '20000000-0000-4000-8000-000000000004',
  hoa: '20000000-0000-4000-8000-000000000008',
  classPkg: '30000000-0000-4000-8000-000000000001',
  gymPkg: '30000000-0000-4000-8000-000000000002',
};
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

const vnDay = (days: number): string =>
  new Date(Date.now() + 7 * 3600_000 + days * 86400_000).toISOString().slice(0, 10);
const at = (day: string, hhmm: string) => `${day}T${hhmm}:00+07:00`;

describe('Lớp học (e2e)', () => {
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
  const chi = () => tokenFor({ sub: ID.chiUser, role: 'MEMBER', tv: 0 });
  const http = () => request(app.getHttpServer());

  const d3 = vnDay(3);
  const d4 = vnDay(4);
  const d6 = vnDay(6);

  /** Tạo lớp thẳng trong DB (không qua API) cho các ca cần dữ liệu sẵn. */
  const makeClass = (data: {
    name: string;
    trainerId?: string;
    capacity?: number;
    startsAt: string;
    endsAt: string;
    cancelBeforeMinutes?: number;
    status?: 'SCHEDULED' | 'CANCELLED';
  }) =>
    prisma.class.create({
      data: {
        trainerId: ID.cuong,
        capacity: 10,
        ...data,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
      },
    });

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
        { id: ID.dungUser, phone: '0900000022', fullName: 'Phạm Dũng', role: 'TRAINER' },
        { id: ID.hoaUser, phone: '0900000023', fullName: 'Ngô Hoa', role: 'TRAINER' },
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
    await prisma.trainer.createMany({
      data: [
        { id: ID.cuong, userId: ID.cuongUser },
        { id: ID.dung, userId: ID.dungUser, status: 'INACTIVE' },
        { id: ID.hoa, userId: ID.hoaUser },
      ],
    });
    await prisma.package.createMany({
      data: [
        {
          id: ID.classPkg,
          name: 'Gym + lớp 1 tháng',
          type: 'GYM',
          price: 500000,
          durationValue: 1,
          durationUnit: 'MONTH',
          includesClass: true,
        },
        {
          id: ID.gymPkg,
          name: 'Gym 1 tháng',
          type: 'GYM',
          price: 300000,
          durationValue: 1,
          durationUnit: 'MONTH',
        },
      ],
    });
    // An, Chi có gói kèm lớp; Bình chỉ có gói gym
    const give = async (memberId: string, packageId: string, includesClass: boolean, n: number) => {
      const order = await prisma.order.create({
        data: {
          memberId,
          packageId,
          priceSnapshot: 1,
          durationValueSnapshot: 1,
          durationUnitSnapshot: 'MONTH',
          includesClassSnapshot: includesClass,
          startsOn: new Date(vnDay(-5)),
          total: 1,
          status: 'PAID',
          expiresAt: new Date(),
          createdBy: ID.admin,
          receiptNo: `BL-TEST-${n}`,
        },
      });
      await prisma.subscription.create({
        data: {
          memberId,
          packageId,
          orderId: order.id,
          packageName: 'Gói test',
          includesClass,
          startsOn: new Date(vnDay(-5)),
          endsOn: new Date(vnDay(25)),
        },
      });
    };
    await give(ID.an, ID.classPkg, true, 1);
    await give(ID.chi, ID.classPkg, true, 2);
    await give(ID.binh, ID.gymPkg, false, 3);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC36 POST /classes', () => {
    it('Admin tạo lớp: 201, mặc định hạn hủy 120 phút, cancelDeadline BE tính', async () => {
      const res = await http()
        .post('/api/v1/classes')
        .set('Authorization', admin())
        .send({
          name: 'Yoga tối',
          trainerId: ID.cuong,
          capacity: 15,
          startsAt: at(d3, '19:00'),
          endsAt: at(d3, '20:00'),
        })
        .expect(201);
      expect(res.body).toMatchObject({
        name: 'Yoga tối',
        description: null,
        trainer: { id: ID.cuong, fullName: 'Lê Minh Cường', avatarUrl: null },
        capacity: 15,
        enrolledCount: 0,
        availableSlots: 15,
        startsAt: at(d3, '19:00'),
        endsAt: at(d3, '20:00'),
        cancelBeforeMinutes: 120,
        cancelDeadline: at(d3, '17:00'),
        status: 'SCHEDULED',
        myEnrollment: null,
      });
    });

    it('Staff tạo: 403; PT ngừng hoạt động, giờ quá khứ, giờ kết thúc sai: 400', async () => {
      const body = {
        name: 'X',
        trainerId: ID.cuong,
        capacity: 5,
        startsAt: at(d4, '06:00'),
        endsAt: at(d4, '07:00'),
      };
      await http().post('/api/v1/classes').set('Authorization', staff()).send(body).expect(403);
      const inactive = await http()
        .post('/api/v1/classes')
        .set('Authorization', admin())
        .send({ ...body, trainerId: ID.dung })
        .expect(400);
      expect(inactive.body.error.details[0].field).toBe('trainerId');
      const past = await http()
        .post('/api/v1/classes')
        .set('Authorization', admin())
        .send({ ...body, startsAt: at(vnDay(-1), '06:00'), endsAt: at(vnDay(-1), '07:00') })
        .expect(400);
      expect(past.body.error.details[0].field).toBe('startsAt');
      await http()
        .post('/api/v1/classes')
        .set('Authorization', admin())
        .send({ ...body, endsAt: at(d4, '05:00') })
        .expect(400);
    });

    it('PT trùng lịch CONFIRMED hoặc lớp khác: 409 SCHEDULE_CONFLICT', async () => {
      const sub = await prisma.subscription.findFirstOrThrow({ where: { memberId: ID.an } });
      await prisma.appointment.create({
        data: {
          memberId: ID.an,
          subscriptionId: sub.id,
          trainerId: ID.hoa,
          status: 'CONFIRMED',
          startsAt: new Date(at(d4, '08:00')),
          endsAt: new Date(at(d4, '09:00')),
        },
      });
      const withAppt = await http()
        .post('/api/v1/classes')
        .set('Authorization', admin())
        .send({
          name: 'Trùng lịch PT',
          trainerId: ID.hoa,
          capacity: 5,
          startsAt: at(d4, '08:30'),
          endsAt: at(d4, '09:30'),
        })
        .expect(409);
      expect(withAppt.body.error.code).toBe('SCHEDULE_CONFLICT');
      const withClass = await http()
        .post('/api/v1/classes')
        .set('Authorization', admin())
        .send({
          name: 'Trùng lớp',
          trainerId: ID.cuong,
          capacity: 5,
          startsAt: at(d3, '19:30'),
          endsAt: at(d3, '20:30'),
        })
        .expect(409);
      expect(withClass.body.error.code).toBe('SCHEDULE_CONFLICT');
    });

    it('hai Admin tạo lớp trùng giờ cùng lúc: chỉ một lớp được tạo', async () => {
      const body = {
        name: 'Song song',
        trainerId: ID.hoa,
        capacity: 5,
        startsAt: at(d6, '06:00'),
        endsAt: at(d6, '07:00'),
      };
      const results = await Promise.all([
        http().post('/api/v1/classes').set('Authorization', admin()).send(body),
        http().post('/api/v1/classes').set('Authorization', admin()).send(body),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    });
  });

  describe('UC37 GET /classes, GET /classes/{id}', () => {
    it('khách chỉ thấy lớp SCHEDULED từ hôm nay, sớm nhất trước; Admin lọc được CANCELLED', async () => {
      await makeClass({ name: 'Đã qua', startsAt: at(vnDay(-2), '06:00'), endsAt: at(vnDay(-2), '07:00') });
      await makeClass({
        name: 'Đã hủy',
        startsAt: at(d6, '18:00'),
        endsAt: at(d6, '19:00'),
        status: 'CANCELLED',
      });
      const res = await http().get('/api/v1/classes').expect(200);
      const names = res.body.data.map((c: { name: string }) => c.name);
      expect(names).not.toContain('Đã qua');
      expect(names).not.toContain('Đã hủy');
      expect(names[0]).toBe('Yoga tối');

      const cancelled = await http()
        .get('/api/v1/classes?status=CANCELLED')
        .set('Authorization', admin())
        .expect(200);
      expect(cancelled.body.data.map((c: { name: string }) => c.name)).toEqual(['Đã hủy']);
      // Không phải Admin gửi status: bị bỏ qua, vẫn chỉ SCHEDULED
      const ignored = await http()
        .get('/api/v1/classes?status=CANCELLED')
        .set('Authorization', an())
        .expect(200);
      expect(ignored.body.data.map((c: { name: string }) => c.name)).not.toContain('Đã hủy');
    });

    it('mine=true: khách 401, Staff 403', async () => {
      await http().get('/api/v1/classes?mine=true').expect(401);
      await http().get('/api/v1/classes?mine=true').set('Authorization', staff()).expect(403);
    });

    it('chi tiết lớp: 200; không có: 404', async () => {
      const c = await prisma.class.findFirstOrThrow({ where: { name: 'Yoga tối' } });
      const res = await http().get(`/api/v1/classes/${c.id}`).expect(200);
      expect(res.body.id).toBe(c.id);
      await http().get(`/api/v1/classes/${UNKNOWN_ID}`).expect(404);
      await http().get('/api/v1/classes/khong-phai-uuid').expect(404);
    });
  });

  describe('UC37 POST /classes/{id}/enrollments', () => {
    it('An đăng ký: 201; gửi lặp: 200 cùng đăng ký; lớp hiện myEnrollment và enrolledCount', async () => {
      const c = await prisma.class.findFirstOrThrow({ where: { name: 'Yoga tối' } });
      const first = await http()
        .post(`/api/v1/classes/${c.id}/enrollments`)
        .set('Authorization', an())
        .expect(201);
      expect(first.body).toMatchObject({
        classId: c.id,
        member: { id: ID.an, memberCode: 'HV000001', fullName: 'Nguyễn Văn An' },
        status: 'REGISTERED',
        cancelledAt: null,
      });
      const again = await http()
        .post(`/api/v1/classes/${c.id}/enrollments`)
        .set('Authorization', an())
        .expect(200);
      expect(again.body.id).toBe(first.body.id);

      const detail = await http().get(`/api/v1/classes/${c.id}`).set('Authorization', an()).expect(200);
      expect(detail.body).toMatchObject({
        enrolledCount: 1,
        availableSlots: 14,
        myEnrollment: { id: first.body.id },
      });
      const mine = await http().get('/api/v1/classes?mine=true').set('Authorization', an()).expect(200);
      expect(mine.body.data.map((x: { id: string }) => x.id)).toEqual([c.id]);
      // Người khác không thấy myEnrollment của An
      const other = await http().get(`/api/v1/classes/${c.id}`).set('Authorization', chi()).expect(200);
      expect(other.body.myEnrollment).toBeNull();
    });

    it('gói không kèm lớp: 422 NO_CLASS_BENEFIT; Staff: 403; lớp không có: 404', async () => {
      const c = await prisma.class.findFirstOrThrow({ where: { name: 'Yoga tối' } });
      const res = await http()
        .post(`/api/v1/classes/${c.id}/enrollments`)
        .set('Authorization', binh())
        .expect(422);
      expect(res.body.error.code).toBe('NO_CLASS_BENEFIT');
      await http().post(`/api/v1/classes/${c.id}/enrollments`).set('Authorization', staff()).expect(403);
      await http().post(`/api/v1/classes/${UNKNOWN_ID}/enrollments`).set('Authorization', an()).expect(404);
    });

    it('gói kèm lớp nhưng hết hạn trước ngày học: 422 NO_CLASS_BENEFIT', async () => {
      const far = await makeClass({
        name: 'Sau hạn gói',
        startsAt: at(vnDay(40), '06:00'),
        endsAt: at(vnDay(40), '07:00'),
      });
      const res = await http()
        .post(`/api/v1/classes/${far.id}/enrollments`)
        .set('Authorization', an())
        .expect(422);
      expect(res.body.error.code).toBe('NO_CLASS_BENEFIT');
    });

    it('lớp đã hủy hoặc đã bắt đầu: 409 CLASS_NOT_OPEN', async () => {
      const cancelled = await prisma.class.findFirstOrThrow({ where: { name: 'Đã hủy' } });
      const res = await http()
        .post(`/api/v1/classes/${cancelled.id}/enrollments`)
        .set('Authorization', an())
        .expect(409);
      expect(res.body.error.code).toBe('CLASS_NOT_OPEN');
      const started = await makeClass({
        name: 'Đang học',
        startsAt: new Date(Date.now() - 10 * 60_000).toISOString(),
        endsAt: new Date(Date.now() + 50 * 60_000).toISOString(),
      });
      const res2 = await http()
        .post(`/api/v1/classes/${started.id}/enrollments`)
        .set('Authorization', an())
        .expect(409);
      expect(res2.body.error.code).toBe('CLASS_NOT_OPEN');
    });

    it('lớp 1 chỗ, An và Chi cùng đăng ký một lúc: chỉ một người được, người kia 409 CLASS_FULL', async () => {
      const small = await makeClass({
        name: 'Một chỗ',
        capacity: 1,
        startsAt: at(d4, '18:00'),
        endsAt: at(d4, '19:00'),
      });
      const results = await Promise.all([
        http().post(`/api/v1/classes/${small.id}/enrollments`).set('Authorization', an()),
        http().post(`/api/v1/classes/${small.id}/enrollments`).set('Authorization', chi()),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(results.find((r) => r.status === 409)?.body.error.code).toBe('CLASS_FULL');
      expect(await prisma.classEnrollment.count({ where: { classId: small.id, status: 'REGISTERED' } })).toBe(
        1,
      );
    });
  });

  describe('UC38 GET /classes/{id}/enrollments', () => {
    it('Admin, Staff, PT dạy lớp: 200; PT khác: 404; hội viên: 403', async () => {
      const c = await prisma.class.findFirstOrThrow({ where: { name: 'Yoga tối' } });
      const res = await http()
        .get(`/api/v1/classes/${c.id}/enrollments`)
        .set('Authorization', admin())
        .expect(200);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
      expect(res.body.data[0].member.id).toBe(ID.an);
      await http().get(`/api/v1/classes/${c.id}/enrollments`).set('Authorization', staff()).expect(200);
      await http().get(`/api/v1/classes/${c.id}/enrollments`).set('Authorization', cuong()).expect(200);
      await http().get(`/api/v1/classes/${c.id}/enrollments`).set('Authorization', hoa()).expect(404);
      await http().get(`/api/v1/classes/${c.id}/enrollments`).set('Authorization', an()).expect(403);
    });
  });

  describe('UC37 DELETE /classes/{id}/enrollments/me', () => {
    it('hủy trước hạn: 204; hủy lại: 404; đăng ký lại tạo đăng ký mới', async () => {
      const c = await prisma.class.findFirstOrThrow({ where: { name: 'Yoga tối' } });
      await http().delete(`/api/v1/classes/${c.id}/enrollments/me`).set('Authorization', an()).expect(204);
      await http().delete(`/api/v1/classes/${c.id}/enrollments/me`).set('Authorization', an()).expect(404);
      const again = await http()
        .post(`/api/v1/classes/${c.id}/enrollments`)
        .set('Authorization', an())
        .expect(201);
      expect(await prisma.classEnrollment.count({ where: { classId: c.id, memberId: ID.an } })).toBe(2);
      expect(again.body.status).toBe('REGISTERED');
    });

    it('quá hạn hủy: 422 CANCELLATION_WINDOW_PASSED; Staff: 403', async () => {
      const soon = await makeClass({
        name: 'Sắp học',
        startsAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        endsAt: new Date(Date.now() + 120 * 60_000).toISOString(),
        cancelBeforeMinutes: 120,
      });
      await http().post(`/api/v1/classes/${soon.id}/enrollments`).set('Authorization', chi()).expect(201);
      const res = await http()
        .delete(`/api/v1/classes/${soon.id}/enrollments/me`)
        .set('Authorization', chi())
        .expect(422);
      expect(res.body.error.code).toBe('CANCELLATION_WINDOW_PASSED');
      await http()
        .delete(`/api/v1/classes/${soon.id}/enrollments/me`)
        .set('Authorization', staff())
        .expect(403);
    });
  });

  describe('UC36 PATCH /classes/{id}', () => {
    it('body rỗng: 400; Staff: 403; không có: 404', async () => {
      const c = await prisma.class.findFirstOrThrow({ where: { name: 'Yoga tối' } });
      await http().patch(`/api/v1/classes/${c.id}`).set('Authorization', admin()).send({}).expect(400);
      await http()
        .patch(`/api/v1/classes/${c.id}`)
        .set('Authorization', staff())
        .send({ capacity: 20 })
        .expect(403);
      await http()
        .patch(`/api/v1/classes/${UNKNOWN_ID}`)
        .set('Authorization', admin())
        .send({ capacity: 20 })
        .expect(404);
    });

    it('sức chứa nhỏ hơn số đang đăng ký: 400; tăng sức chứa: 200', async () => {
      const small = await prisma.class.findFirstOrThrow({ where: { name: 'Một chỗ' } });
      // Lớp 1 chỗ đang có 1 người: không giảm được dưới 1 (DTO chặn 0), thử với lớp có 2 người
      const c = await prisma.class.findFirstOrThrow({ where: { name: 'Yoga tối' } });
      await http().post(`/api/v1/classes/${c.id}/enrollments`).set('Authorization', chi()).expect(201);
      const res = await http()
        .patch(`/api/v1/classes/${c.id}`)
        .set('Authorization', admin())
        .send({ capacity: 1 })
        .expect(400);
      expect(res.body.error.details[0].field).toBe('capacity');
      const ok = await http()
        .patch(`/api/v1/classes/${small.id}`)
        .set('Authorization', admin())
        .send({ capacity: 3 })
        .expect(200);
      expect(ok.body).toMatchObject({ capacity: 3, enrolledCount: 1, availableSlots: 2 });
    });

    it('đổi giờ trùng lịch PT: 409 SCHEDULE_CONFLICT; đổi giờ hợp lệ: 200', async () => {
      const c = await prisma.class.findFirstOrThrow({ where: { name: 'Một chỗ' } });
      const conflict = await http()
        .patch(`/api/v1/classes/${c.id}`)
        .set('Authorization', admin())
        .send({ trainerId: ID.hoa, startsAt: at(d4, '08:00'), endsAt: at(d4, '09:00') })
        .expect(409);
      expect(conflict.body.error.code).toBe('SCHEDULE_CONFLICT');
      const ok = await http()
        .patch(`/api/v1/classes/${c.id}`)
        .set('Authorization', admin())
        .send({ startsAt: at(d4, '18:30'), endsAt: at(d4, '19:30') })
        .expect(200);
      expect(ok.body.startsAt).toBe(at(d4, '18:30'));
    });

    it('hủy lớp: đăng ký chuyển CANCELLED, người đăng ký nhận thông báo; sửa lớp đã hủy: 400', async () => {
      const c = await prisma.class.findFirstOrThrow({ where: { name: 'Yoga tối' } });
      const res = await http()
        .patch(`/api/v1/classes/${c.id}`)
        .set('Authorization', admin())
        .send({ status: 'CANCELLED' })
        .expect(200);
      expect(res.body).toMatchObject({ status: 'CANCELLED', enrolledCount: 0 });
      expect(await prisma.classEnrollment.count({ where: { classId: c.id, status: 'REGISTERED' } })).toBe(0);
      const notes = await prisma.notification.findMany({
        where: { type: 'CLASS_CANCELLED', targetId: c.id },
      });
      expect(notes.map((n) => n.userId).sort()).toEqual([ID.anUser, ID.chiUser].sort());

      await http()
        .patch(`/api/v1/classes/${c.id}`)
        .set('Authorization', admin())
        .send({ name: 'Mở lại' })
        .expect(400);
    });
  });
});
