import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { AccessTokenPayload } from '../src/common/auth/jwt-auth.guard';
import { CheckInsService } from '../src/modules/check-ins/check-ins.service';
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

const STAFF = '00000000-0000-4000-8000-000000000002';
const TRAINER = '00000000-0000-4000-8000-000000000003';
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

/** Ngày theo giờ Việt Nam cách hôm nay `days` ngày, dạng Date cho cột @db.Date. */
const vnDay = (days: number): Date =>
  new Date(new Date(Date.now() + 7 * 3600_000 + days * 86400_000).toISOString().slice(0, 10));

type Fixture = { userId: string; memberId: string; phone: string; qr: string };

describe('Check-in (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  let service: CheckInsService;
  const tokenFor = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;
  const staff = () => tokenFor({ sub: STAFF, role: 'STAFF', tv: 0 });
  const trainer = () => tokenFor({ sub: TRAINER, role: 'TRAINER', tv: 0 });
  const memberToken = (f: Fixture) => tokenFor({ sub: f.userId, role: 'MEMBER', tv: 0 });
  const http = () => request(app.getHttpServer());
  const checkIn = (body: object) => http().post('/api/v1/check-ins').set('Authorization', staff()).send(body);

  const gymPackage = randomUUID();
  const ptPackage = randomUUID();
  const people: Record<string, Fixture> = {};

  /** Hội viên kèm các gói (mỗi gói một đơn PAID). */
  const addMember = async (
    key: string,
    phone: string,
    fullName: string,
    subs: {
      pkg: 'GYM' | 'PT';
      status?: 'ACTIVE' | 'FROZEN' | 'EXPIRED';
      from: number;
      to: number;
      name?: string;
    }[],
  ) => {
    const user = await prisma.user.create({ data: { phone, fullName, role: 'MEMBER' } });
    const member = await prisma.member.create({
      data: { userId: user.id, memberCode: `HV${phone.slice(-6)}`, qrToken: `qr-${key}` },
    });
    for (const s of subs) {
      const packageId = s.pkg === 'GYM' ? gymPackage : ptPackage;
      const order = await prisma.order.create({
        data: {
          memberId: member.id,
          packageId,
          priceSnapshot: 500000,
          durationValueSnapshot: 1,
          durationUnitSnapshot: 'MONTH',
          totalSessionsSnapshot: s.pkg === 'PT' ? 12 : null,
          sessionMinutesSnapshot: s.pkg === 'PT' ? 60 : null,
          includesClassSnapshot: false,
          startsOn: vnDay(s.from),
          total: 500000,
          status: 'PAID',
          expiresAt: new Date(),
          createdBy: STAFF,
        },
      });
      await prisma.subscription.create({
        data: {
          memberId: member.id,
          packageId,
          orderId: order.id,
          packageName: s.name ?? (s.pkg === 'GYM' ? 'Gym 1 tháng' : 'PT 12 buổi'),
          totalSessions: s.pkg === 'PT' ? 12 : null,
          sessionMinutes: s.pkg === 'PT' ? 60 : null,
          includesClass: false,
          startsOn: vnDay(s.from),
          endsOn: vnDay(s.to),
          status: s.status ?? 'ACTIVE',
        },
      });
    }
    people[key] = { userId: user.id, memberId: member.id, phone, qr: `qr-${key}` };
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    jwt = moduleRef.get(JwtService);
    prisma = moduleRef.get(PrismaService);
    service = moduleRef.get(CheckInsService);

    await prisma.$executeRawUnsafe('TRUNCATE packages, audit_logs, users RESTART IDENTITY CASCADE');
    await prisma.user.createMany({
      data: [
        { id: STAFF, phone: '0900000011', fullName: 'Lễ tân Hòa', role: 'STAFF' },
        { id: TRAINER, phone: '0900000021', fullName: 'PT Cường', role: 'TRAINER' },
      ],
    });
    await prisma.package.createMany({
      data: [
        {
          id: gymPackage,
          name: 'Gym 1 tháng',
          type: 'GYM',
          price: 500000,
          durationValue: 1,
          durationUnit: 'MONTH',
        },
        {
          id: ptPackage,
          name: 'PT 12 buổi',
          type: 'PT',
          price: 3600000,
          durationValue: 2,
          durationUnit: 'MONTH',
          totalSessions: 12,
          sessionMinutes: 60,
        },
      ],
    });
    // An: 2 gói gym, gói hết hạn sớm nhất còn 5 ngày (tính cả hôm nay) → sắp hết hạn
    await addMember('an', '0901000001', 'Nguyễn Văn An', [
      { pkg: 'GYM', from: -20, to: 40, name: 'Gym 3 tháng' },
      { pkg: 'GYM', from: -25, to: 4, name: 'Gym 1 tháng' },
    ]);
    // Bình: chỉ có gói PT ACTIVE → được vào phòng tập (Q17b)
    await addMember('binh', '0901000002', 'Trần Thị Bình', [{ pkg: 'PT', from: -5, to: 50 }]);
    // Chi: gói đã mua nhưng chưa tới ngày bắt đầu → NO_ACTIVE_SUBSCRIPTION (Q17b)
    await addMember('chi', '0901000003', 'Lê Chi', [{ pkg: 'GYM', from: 3, to: 33 }]);
    // Dũng: gói đã hết hạn
    await addMember('dung', '0901000004', 'Phạm Dũng', [
      { pkg: 'GYM', status: 'EXPIRED', from: -40, to: -10 },
    ]);
    // Em: gói đang bảo lưu
    await addMember('em', '0901000005', 'Đỗ Em', [{ pkg: 'GYM', status: 'FROZEN', from: -10, to: 20 }]);
    // Giang: chưa mua gói nào
    await addMember('giang', '0901000006', 'Vũ Giang', []);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC16 POST /check-ins', () => {
    it('quét QR: chọn gói hết hạn sớm nhất, cảnh báo còn ≤ 7 ngày', async () => {
      const res = await checkIn({ qrToken: people.an.qr }).expect(201);
      expect(res.body).toMatchObject({
        member: { id: people.an.memberId, fullName: 'Nguyễn Văn An', phone: '0901000001' },
        subscription: { packageName: 'Gym 1 tháng', daysLeft: 5 },
        method: 'QR',
        checkedOutAt: null,
        checkoutType: null,
        checkedInBy: { id: STAFF, fullName: 'Lễ tân Hòa' },
        expiringSoon: true,
      });
      expect(res.body.checkedInAt).toMatch(/\+07:00$/);
    });

    it('còn lượt chưa check-out: 409 ALREADY_CHECKED_IN kèm checkInId', async () => {
      const open = await prisma.checkIn.findFirstOrThrow({ where: { memberId: people.an.memberId } });
      const res = await checkIn({ phone: people.an.phone }).expect(409);
      expect(res.body.error).toMatchObject({ code: 'ALREADY_CHECKED_IN', details: { checkInId: open.id } });
    });

    it('nhập SĐT, chỉ có gói PT ACTIVE: vào được, không trừ buổi PT', async () => {
      const res = await checkIn({ phone: people.binh.phone }).expect(201);
      expect(res.body).toMatchObject({
        method: 'PHONE',
        subscription: { packageName: 'PT 12 buổi' },
        expiringSoon: false,
      });
      expect(await prisma.appointment.count()).toBe(0);
    });

    it('gói chưa tới ngày bắt đầu hoặc chưa có gói: 422 NO_ACTIVE_SUBSCRIPTION', async () => {
      const notStarted = await checkIn({ qrToken: people.chi.qr }).expect(422);
      expect(notStarted.body.error.code).toBe('NO_ACTIVE_SUBSCRIPTION');
      const none = await checkIn({ qrToken: people.giang.qr }).expect(422);
      expect(none.body.error.code).toBe('NO_ACTIVE_SUBSCRIPTION');
    });

    it('gói hết hạn: 422 SUBSCRIPTION_EXPIRED; gói bảo lưu: 422 SUBSCRIPTION_FROZEN', async () => {
      const expired = await checkIn({ qrToken: people.dung.qr }).expect(422);
      expect(expired.body.error.code).toBe('SUBSCRIPTION_EXPIRED');
      const frozen = await checkIn({ qrToken: people.em.qr }).expect(422);
      expect(frozen.body.error.code).toBe('SUBSCRIPTION_FROZEN');
    });

    it('QR không khớp: 422 INVALID_QR; SĐT không khớp: 404 NOT_FOUND', async () => {
      const qr = await checkIn({ qrToken: 'qr-khong-co' }).expect(422);
      expect(qr.body.error.code).toBe('INVALID_QR');
      const phone = await checkIn({ phone: '0999999999' }).expect(404);
      expect(phone.body.error.code).toBe('NOT_FOUND');
    });

    it('gửi cả hai hoặc không gửi gì: 400 VALIDATION_ERROR', async () => {
      const both = await checkIn({ qrToken: people.chi.qr, phone: people.chi.phone }).expect(400);
      expect(both.body.error.code).toBe('VALIDATION_ERROR');
      await checkIn({}).expect(400);
    });

    it('hội viên tự check-in: 403 FORBIDDEN; không token: 401', async () => {
      const res = await http()
        .post('/api/v1/check-ins')
        .set('Authorization', memberToken(people.chi))
        .send({ qrToken: people.chi.qr })
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      await http().post('/api/v1/check-ins').send({ qrToken: people.chi.qr }).expect(401);
    });
  });

  describe('UC18 GET /check-ins', () => {
    it('Staff xem người đang trong phòng (present=true), mới nhất trước', async () => {
      const res = await http()
        .get('/api/v1/check-ins?present=true')
        .set('Authorization', staff())
        .expect(200);
      expect(res.body.data.map((c: { member: { id: string } }) => c.member.id)).toEqual([
        people.binh.memberId,
        people.an.memberId,
      ]);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 2, totalPages: 1 });
    });

    it('Staff lọc memberId; hội viên chỉ thấy của mình (memberId bị bỏ qua)', async () => {
      const byMember = await http()
        .get(`/api/v1/check-ins?memberId=${people.binh.memberId}`)
        .set('Authorization', staff())
        .expect(200);
      expect(byMember.body.meta.total).toBe(1);
      const mine = await http()
        .get(`/api/v1/check-ins?memberId=${people.binh.memberId}`)
        .set('Authorization', memberToken(people.an))
        .expect(200);
      expect(mine.body.data.map((c: { member: { id: string } }) => c.member.id)).toEqual([
        people.an.memberId,
      ]);
    });

    it('present sai giá trị: 400; PT gọi: 403', async () => {
      await http().get('/api/v1/check-ins?present=abc').set('Authorization', staff()).expect(400);
      await http().get('/api/v1/check-ins').set('Authorization', trainer()).expect(403);
    });
  });

  describe('UC17 POST /check-ins/{id}/checkout', () => {
    it('hội viên tự check-out: SELF; gửi lặp trả lượt hiện tại', async () => {
      const open = await prisma.checkIn.findFirstOrThrow({ where: { memberId: people.an.memberId } });
      const res = await http()
        .post(`/api/v1/check-ins/${open.id}/checkout`)
        .set('Authorization', memberToken(people.an))
        .expect(200);
      expect(res.body).toMatchObject({ id: open.id, checkoutType: 'SELF' });
      expect(res.body.checkedOutAt).toMatch(/\+07:00$/);
      const again = await http()
        .post(`/api/v1/check-ins/${open.id}/checkout`)
        .set('Authorization', staff())
        .expect(200);
      expect(again.body).toMatchObject({ checkoutType: 'SELF', checkedOutAt: res.body.checkedOutAt });
    });

    it('hội viên check-out lượt của người khác: 404; Staff làm hộ: STAFF', async () => {
      const binh = await prisma.checkIn.findFirstOrThrow({ where: { memberId: people.binh.memberId } });
      await http()
        .post(`/api/v1/check-ins/${binh.id}/checkout`)
        .set('Authorization', memberToken(people.an))
        .expect(404);
      const res = await http()
        .post(`/api/v1/check-ins/${binh.id}/checkout`)
        .set('Authorization', staff())
        .expect(200);
      expect(res.body.checkoutType).toBe('STAFF');
    });

    it('không có: 404; PT gọi: 403; không token: 401', async () => {
      await http().post(`/api/v1/check-ins/${UNKNOWN_ID}/checkout`).set('Authorization', staff()).expect(404);
      await http()
        .post(`/api/v1/check-ins/${UNKNOWN_ID}/checkout`)
        .set('Authorization', trainer())
        .expect(403);
      await http().post(`/api/v1/check-ins/${UNKNOWN_ID}/checkout`).expect(401);
    });
  });

  describe('Job 23:59 tự đóng lượt còn mở (quyết định 17)', () => {
    it('đóng mọi lượt chưa check-out với checkoutType AUTO, không đụng lượt đã đóng', async () => {
      await checkIn({ qrToken: people.an.qr }).expect(201);
      const closedBefore = await prisma.checkIn.count({ where: { checkoutType: { in: ['SELF', 'STAFF'] } } });

      expect(await service.closeOpenCheckIns()).toBe(1);
      expect(await prisma.checkIn.count({ where: { checkedOutAt: null } })).toBe(0);
      expect(await prisma.checkIn.count({ where: { checkoutType: 'AUTO' } })).toBe(1);
      expect(await prisma.checkIn.count({ where: { checkoutType: { in: ['SELF', 'STAFF'] } } })).toBe(
        closedBefore,
      );
      // Đóng xong thì check-in lại được
      await checkIn({ qrToken: people.an.qr }).expect(201);
    });
  });
});
