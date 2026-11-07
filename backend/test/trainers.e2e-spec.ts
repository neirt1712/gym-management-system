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
  cuongUser: '00000000-0000-4000-8000-000000000003',
  dungUser: '00000000-0000-4000-8000-000000000004',
  oldPtUser: '00000000-0000-4000-8000-000000000007',
  anUser: '00000000-0000-4000-8000-000000000005',
  binhUser: '00000000-0000-4000-8000-000000000006',
  an: '10000000-0000-4000-8000-000000000005',
  binh: '10000000-0000-4000-8000-000000000006',
  cuong: '20000000-0000-4000-8000-000000000003',
  dung: '20000000-0000-4000-8000-000000000004',
  oldPt: '20000000-0000-4000-8000-000000000007',
  ptPackage: '30000000-0000-4000-8000-000000000001',
  anOrder: '40000000-0000-4000-8000-000000000001',
  binhOrder: '40000000-0000-4000-8000-000000000002',
  anSub: '50000000-0000-4000-8000-000000000001',
  binhSub: '50000000-0000-4000-8000-000000000002',
};
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

/** Ngày giờ Việt Nam cách hôm nay `days` ngày, dạng YYYY-MM-DD. */
const vnDay = (days: number): string =>
  new Date(Date.now() + 7 * 3600_000 + days * 86400_000).toISOString().slice(0, 10);
const at = (day: string, hhmm: string) => `${day}T${hhmm}:00+07:00`;

describe('PT (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  const tokenFor = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;
  const admin = () => tokenFor({ sub: ID.admin, role: 'ADMIN', tv: 0 });
  const cuong = () => tokenFor({ sub: ID.cuongUser, role: 'TRAINER', tv: 0 });
  const member = () => tokenFor({ sub: ID.anUser, role: 'MEMBER', tv: 0 });
  const http = () => request(app.getHttpServer());

  const d1 = vnDay(1);
  const d2 = vnDay(2);
  const d5 = vnDay(5);

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    jwt = moduleRef.get(JwtService);
    prisma = moduleRef.get(PrismaService);

    await prisma.$executeRawUnsafe('TRUNCATE packages, audit_logs, users RESTART IDENTITY CASCADE');
    await prisma.user.createMany({
      data: [
        { id: ID.admin, phone: '0900000001', fullName: 'Quản trị', role: 'ADMIN' },
        {
          id: ID.cuongUser,
          phone: '0900000021',
          fullName: 'Lê Minh Cường',
          role: 'TRAINER',
          email: 'c@gym.local',
        },
        { id: ID.dungUser, phone: '0900000022', fullName: 'Phạm Dũng', role: 'TRAINER' },
        // Từng là PT, nay là Staff: hồ sơ INACTIVE, khách không thấy, Admin và link cũ vẫn xem được
        { id: ID.oldPtUser, phone: '0900000023', fullName: 'An Cũ', role: 'STAFF' },
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
        { id: ID.cuong, userId: ID.cuongUser, specialties: ['Giảm mỡ', 'Tăng cơ'], experienceYears: 5 },
        { id: ID.dung, userId: ID.dungUser, specialties: ['Yoga'], status: 'INACTIVE' },
        { id: ID.oldPt, userId: ID.oldPtUser, status: 'INACTIVE' },
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
    const order = (id: string, memberId: string) => ({
      id,
      memberId,
      packageId: ID.ptPackage,
      priceSnapshot: 3600000,
      durationValueSnapshot: 2,
      durationUnitSnapshot: 'MONTH' as const,
      totalSessionsSnapshot: 12,
      sessionMinutesSnapshot: 60,
      includesClassSnapshot: false,
      startsOn: new Date(vnDay(-10)),
      total: 3600000,
      status: 'PAID' as const,
      expiresAt: new Date(),
      createdBy: ID.admin,
    });
    await prisma.order.createMany({ data: [order(ID.anOrder, ID.an), order(ID.binhOrder, ID.binh)] });
    const sub = (id: string, memberId: string, orderId: string) => ({
      id,
      memberId,
      packageId: ID.ptPackage,
      orderId,
      packageName: 'PT 12 buổi',
      totalSessions: 12,
      sessionMinutes: 60,
      includesClass: false,
      startsOn: new Date(vnDay(-10)),
      endsOn: new Date(vnDay(50)),
    });
    await prisma.subscription.createMany({
      data: [sub(ID.anSub, ID.an, ID.anOrder), sub(ID.binhSub, ID.binh, ID.binhOrder)],
    });
    const appt = (
      memberId: string,
      subscriptionId: string,
      status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
      day: string,
    ) => ({
      memberId,
      subscriptionId,
      trainerId: ID.cuong,
      status,
      startsAt: new Date(at(day, '09:00')),
      endsAt: new Date(at(day, '10:00')),
    });
    await prisma.appointment.createMany({
      data: [
        // An: 1 buổi đã tập, 1 buổi CONFIRMED ngày mốt
        appt(ID.an, ID.anSub, 'COMPLETED', vnDay(-3)),
        appt(ID.an, ID.anSub, 'CONFIRMED', d2),
        // Bình: 1 buổi PENDING ngày mai (sắp tới gần hơn An)
        appt(ID.binh, ID.binhSub, 'PENDING', d1),
      ],
    });
    // Lớp của Cường ngày thứ 5: là giờ bận
    await prisma.class.create({
      data: {
        name: 'Tăng cơ',
        trainerId: ID.cuong,
        capacity: 10,
        startsAt: new Date(at(d5, '18:00')),
        endsAt: new Date(at(d5, '19:00')),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC21 GET /trainers', () => {
    it('khách chỉ thấy PT ACTIVE, không có SĐT, email', async () => {
      const res = await http().get('/api/v1/trainers').expect(200);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
      expect(res.body.data).toEqual([
        {
          id: ID.cuong,
          userId: ID.cuongUser,
          fullName: 'Lê Minh Cường',
          avatarUrl: null,
          specialties: ['Giảm mỡ', 'Tăng cơ'],
          bio: null,
          experienceYears: 5,
          status: 'ACTIVE',
        },
      ]);
    });

    it('Admin thấy cả INACTIVE, tên A→Z, lọc status; hội viên gửi status bị bỏ qua', async () => {
      const all = await http().get('/api/v1/trainers').set('Authorization', admin()).expect(200);
      expect(all.body.data.map((t: { id: string }) => t.id)).toEqual([ID.oldPt, ID.cuong, ID.dung]);
      const inactive = await http()
        .get('/api/v1/trainers?status=INACTIVE')
        .set('Authorization', admin())
        .expect(200);
      expect(inactive.body.data.map((t: { id: string }) => t.id)).toEqual([ID.oldPt, ID.dung]);
      const asMember = await http()
        .get('/api/v1/trainers?status=INACTIVE')
        .set('Authorization', member())
        .expect(200);
      expect(asMember.body.data.map((t: { id: string }) => t.id)).toEqual([ID.cuong]);
    });

    it('tìm tên không dấu và theo chuyên môn', async () => {
      const byName = await http().get('/api/v1/trainers?q=cuong').expect(200);
      expect(byName.body.meta.total).toBe(1);
      const bySpecialty = await http()
        .get(`/api/v1/trainers?specialty=${encodeURIComponent('Yoga')}`)
        .set('Authorization', admin())
        .expect(200);
      expect(bySpecialty.body.data.map((t: { id: string }) => t.id)).toEqual([ID.dung]);
    });

    it('status sai giá trị: 400 VALIDATION_ERROR', async () => {
      const res = await http().get('/api/v1/trainers?status=X').expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('UC21 GET /trainers/{id}', () => {
    it('xem được cả hồ sơ INACTIVE', async () => {
      const res = await http().get(`/api/v1/trainers/${ID.dung}`).expect(200);
      expect(res.body).toMatchObject({ id: ID.dung, status: 'INACTIVE', fullName: 'Phạm Dũng' });
    });

    it('không có: 404 NOT_FOUND; người đã thôi làm PT vẫn xem được (INACTIVE)', async () => {
      const res = await http().get(`/api/v1/trainers/${UNKNOWN_ID}`).expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
      const old = await http().get(`/api/v1/trainers/${ID.oldPt}`).expect(200);
      expect(old.body.status).toBe('INACTIVE');
    });
  });

  describe('UC33 PATCH /trainers/{id}', () => {
    it('Admin sửa tên (lưu ở users) và chuyên môn', async () => {
      const res = await http()
        .patch(`/api/v1/trainers/${ID.dung}`)
        .set('Authorization', admin())
        .send({ fullName: 'Phạm Văn Dũng', specialties: ['Yoga', 'Giãn cơ'], experienceYears: 6 })
        .expect(200);
      expect(res.body).toMatchObject({
        fullName: 'Phạm Văn Dũng',
        specialties: ['Yoga', 'Giãn cơ'],
        experienceYears: 6,
      });
      expect((await prisma.user.findUniqueOrThrow({ where: { id: ID.dungUser } })).fullName).toBe(
        'Phạm Văn Dũng',
      );
    });

    it('body rỗng, kinh nghiệm âm: 400 VALIDATION_ERROR', async () => {
      await http().patch(`/api/v1/trainers/${ID.dung}`).set('Authorization', admin()).send({}).expect(400);
      await http()
        .patch(`/api/v1/trainers/${ID.dung}`)
        .set('Authorization', admin())
        .send({ experienceYears: -1 })
        .expect(400);
    });

    it('PT tự sửa: 403 FORBIDDEN; không có: 404; không token: 401', async () => {
      const res = await http()
        .patch(`/api/v1/trainers/${ID.cuong}`)
        .set('Authorization', cuong())
        .send({ bio: 'x' })
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      await http()
        .patch(`/api/v1/trainers/${UNKNOWN_ID}`)
        .set('Authorization', admin())
        .send({ bio: 'x' })
        .expect(404);
      await http().patch(`/api/v1/trainers/${ID.cuong}`).send({ bio: 'x' }).expect(401);
    });
  });

  describe('UC22 PUT, UC23 GET /trainers/{id}/availability', () => {
    it('PT thay khung giờ của mình; GET trả slots và giờ bận (lịch CONFIRMED, lớp)', async () => {
      const put = await http()
        .put(`/api/v1/trainers/${ID.cuong}/availability`)
        .set('Authorization', cuong())
        .send({
          from: d1,
          to: d5,
          slots: [
            { startsAt: at(d2, '08:00'), endsAt: at(d2, '12:00') },
            { startsAt: at(d1, '17:00'), endsAt: at(d1, '21:00') },
          ],
        })
        .expect(200);
      expect(put.body.slots.map((s: { startsAt: string }) => s.startsAt)).toEqual([
        at(d1, '17:00'),
        at(d2, '08:00'),
      ]);
      expect(put.body.busy).toEqual([
        { startsAt: at(d2, '09:00'), endsAt: at(d2, '10:00') },
        { startsAt: at(d5, '18:00'), endsAt: at(d5, '19:00') },
      ]);

      // Thay lại chỉ ngày d1: khung ngày d2 nằm ngoài khoảng nên giữ nguyên
      await http()
        .put(`/api/v1/trainers/${ID.cuong}/availability`)
        .set('Authorization', admin())
        .send({ from: d1, to: d1, slots: [] })
        .expect(200);
      const get = await http()
        .get(`/api/v1/trainers/${ID.cuong}/availability?from=${d1}&to=${d5}`)
        .expect(200);
      expect(get.body).toMatchObject({ trainerId: ID.cuong, from: d1, to: d5 });
      expect(get.body.slots).toEqual([
        { id: expect.any(String), startsAt: at(d2, '08:00'), endsAt: at(d2, '12:00') },
      ]);
    });

    it('GET mặc định lấy 4 tuần từ hôm nay', async () => {
      const res = await http().get(`/api/v1/trainers/${ID.cuong}/availability`).expect(200);
      expect(res.body.from).toBe(vnDay(0));
      expect(res.body.to).toBe(vnDay(27));
    });

    it('GET khoảng quá 35 ngày hoặc to trước from: 400; PT không có: 404', async () => {
      await http()
        .get(`/api/v1/trainers/${ID.cuong}/availability?from=${d1}&to=${vnDay(40)}`)
        .expect(400);
      await http().get(`/api/v1/trainers/${ID.cuong}/availability?from=${d5}&to=${d1}`).expect(400);
      await http().get(`/api/v1/trainers/${UNKNOWN_ID}/availability`).expect(404);
    });

    it('PUT chồng giờ, ra ngoài khoảng, endsAt trước startsAt: 400 kèm field slots[i]', async () => {
      const send = (slots: { startsAt: string; endsAt: string }[]) =>
        http()
          .put(`/api/v1/trainers/${ID.cuong}/availability`)
          .set('Authorization', cuong())
          .send({ from: d1, to: d2, slots })
          .expect(400);
      const overlap = await send([
        { startsAt: at(d1, '08:00'), endsAt: at(d1, '10:00') },
        { startsAt: at(d1, '09:00'), endsAt: at(d1, '11:00') },
      ]);
      expect(overlap.body.error.details).toEqual([
        { field: 'slots[1].startsAt', messages: expect.any(Array) },
      ]);
      const outside = await send([{ startsAt: at(d5, '08:00'), endsAt: at(d5, '10:00') }]);
      expect(outside.body.error.details[0].field).toBe('slots[0].startsAt');
      const reversed = await send([{ startsAt: at(d1, '10:00'), endsAt: at(d1, '08:00') }]);
      expect(reversed.body.error.details[0].field).toBe('slots[0].endsAt');
      // Dữ liệu cũ giữ nguyên khi lỗi
      expect(await prisma.trainerAvailability.count({ where: { trainerId: ID.cuong } })).toBe(1);
    });

    it('PUT chồng với khung cũ vắt qua mép khoảng: 400 kèm field slots[i], khung cũ giữ nguyên', async () => {
      const d3 = vnDay(3);
      await prisma.trainerAvailability.create({
        data: {
          trainerId: ID.cuong,
          startsAt: new Date(at(d3, '22:00')),
          endsAt: new Date(at(vnDay(4), '02:00')),
        },
      });
      const res = await http()
        .put(`/api/v1/trainers/${ID.cuong}/availability`)
        .set('Authorization', cuong())
        .send({
          from: d3,
          to: d3,
          slots: [
            { startsAt: at(d3, '08:00'), endsAt: at(d3, '09:00') },
            { startsAt: at(d3, '21:00'), endsAt: at(d3, '23:00') },
          ],
        })
        .expect(400);
      expect(res.body.error.details).toEqual([{ field: 'slots[1].startsAt', messages: expect.any(Array) }]);
      expect(await prisma.trainerAvailability.count({ where: { trainerId: ID.cuong } })).toBe(2);
    });

    it('PT sửa khung của PT khác: 404; hội viên: 403; không token: 401', async () => {
      const body = { from: d1, to: d1, slots: [] };
      await http()
        .put(`/api/v1/trainers/${ID.dung}/availability`)
        .set('Authorization', cuong())
        .send(body)
        .expect(404);
      await http()
        .put(`/api/v1/trainers/${ID.cuong}/availability`)
        .set('Authorization', member())
        .send(body)
        .expect(403);
      await http().put(`/api/v1/trainers/${ID.cuong}/availability`).send(body).expect(401);
    });
  });

  describe('UC28 GET /trainers/{id}/members', () => {
    it('hội viên phụ trách, buổi sắp tới gần nhất trước, kèm gói PT và số buổi', async () => {
      const res = await http()
        .get(`/api/v1/trainers/${ID.cuong}/members`)
        .set('Authorization', cuong())
        .expect(200);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 2, totalPages: 1 });
      expect(res.body.data.map((r: { member: { id: string } }) => r.member.id)).toEqual([ID.binh, ID.an]);
      expect(res.body.data[1]).toEqual({
        member: {
          id: ID.an,
          memberCode: 'HV000001',
          fullName: 'Nguyễn Văn An',
          phone: '0901234567',
          avatarUrl: null,
        },
        subscriptions: [
          expect.objectContaining({
            id: ID.anSub,
            type: 'PT',
            status: 'ACTIVE',
            sessions: { total: 12, used: 1, held: 1, remaining: 11, bookable: 10 },
          }),
        ],
        nextAppointmentAt: at(d2, '09:00'),
      });
    });

    it('Admin xem được; tìm theo mã hội viên', async () => {
      const res = await http()
        .get(`/api/v1/trainers/${ID.cuong}/members?q=hv000002`)
        .set('Authorization', admin())
        .expect(200);
      expect(res.body.data.map((r: { member: { id: string } }) => r.member.id)).toEqual([ID.binh]);
    });

    it('PT xem của PT khác: 404; hội viên: 403; pageSize sai: 400', async () => {
      await http().get(`/api/v1/trainers/${ID.dung}/members`).set('Authorization', cuong()).expect(404);
      await http().get(`/api/v1/trainers/${ID.cuong}/members`).set('Authorization', member()).expect(403);
      await http()
        .get(`/api/v1/trainers/${ID.cuong}/members?pageSize=0`)
        .set('Authorization', admin())
        .expect(400);
    });
  });
});
