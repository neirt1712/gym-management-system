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
 * Thông báo được chèn thẳng vào DB; module thanh toán (Sơn) là nơi tạo PAYMENT_SUCCESS/FAILED thật.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://gym:gym@localhost:5432/gym_test?schema=public';
if (!new URL(TEST_DATABASE_URL).pathname.endsWith('_test')) {
  throw new Error(`TEST_DATABASE_URL phải trỏ tới DB tên *_test, đang là ${TEST_DATABASE_URL}`);
}
process.env.DATABASE_URL = TEST_DATABASE_URL;

const ID = {
  an: '00000000-0000-4000-8000-000000000005',
  binh: '00000000-0000-4000-8000-000000000006',
  n1: '60000000-0000-4000-8000-000000000001',
  n2: '60000000-0000-4000-8000-000000000002',
  n3: '60000000-0000-4000-8000-000000000003',
  binhNote: '60000000-0000-4000-8000-000000000009',
  order: '40000000-0000-4000-8000-000000000001',
};
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

describe('Thông báo (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  const tokenFor = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;
  const an = () => tokenFor({ sub: ID.an, role: 'MEMBER', tv: 0 });
  const http = () => request(app.getHttpServer());

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
        { id: ID.an, phone: '0901234567', fullName: 'Nguyễn Văn An', role: 'MEMBER' },
        { id: ID.binh, phone: '0912345678', fullName: 'Trần Thị Bình', role: 'MEMBER' },
      ],
    });
    await prisma.notification.createMany({
      data: [
        {
          id: ID.n1,
          userId: ID.an,
          type: 'PAYMENT_SUCCESS',
          title: 'Thanh toán thành công',
          body: 'Đơn của bạn đã được thanh toán.',
          targetType: 'ORDER',
          targetId: ID.order,
          isRead: true,
          createdAt: new Date('2026-10-08T02:00:00Z'),
        },
        {
          id: ID.n2,
          userId: ID.an,
          type: 'PAYMENT_FAILED',
          title: 'Thanh toán thất bại',
          body: 'Giao dịch không thành công.',
          createdAt: new Date('2026-10-09T02:00:00Z'),
        },
        {
          id: ID.n3,
          userId: ID.an,
          type: 'SUBSCRIPTION_EXPIRING',
          title: 'Gói sắp hết hạn',
          body: 'Gói của bạn còn 7 ngày.',
          createdAt: new Date('2026-10-10T02:00:00Z'),
        },
        {
          id: ID.binhNote,
          userId: ID.binh,
          type: 'BROADCAST',
          title: 'Của Bình',
          body: 'Không phải của An.',
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC42 GET /notifications', () => {
    it('chỉ thấy của mình, mới nhất trước, meta có unreadCount', async () => {
      const res = await http().get('/api/v1/notifications').set('Authorization', an()).expect(200);
      expect(res.body.data.map((n: { id: string }) => n.id)).toEqual([ID.n3, ID.n2, ID.n1]);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 3, totalPages: 1, unreadCount: 2 });
      expect(res.body.data[2]).toEqual({
        id: ID.n1,
        type: 'PAYMENT_SUCCESS',
        title: 'Thanh toán thành công',
        body: 'Đơn của bạn đã được thanh toán.',
        targetType: 'ORDER',
        targetId: ID.order,
        isRead: true,
        createdAt: '2026-10-08T09:00:00+07:00',
      });
    });

    it('isRead=false lọc chưa đọc; unreadCount không đổi theo bộ lọc', async () => {
      const res = await http()
        .get('/api/v1/notifications?isRead=false&pageSize=1')
        .set('Authorization', an())
        .expect(200);
      expect(res.body.data.map((n: { id: string }) => n.id)).toEqual([ID.n3]);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 1, total: 2, totalPages: 2, unreadCount: 2 });
    });

    it('isRead sai giá trị: 400 VALIDATION_ERROR', async () => {
      const res = await http().get('/api/v1/notifications?isRead=abc').set('Authorization', an()).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('không token: 401 UNAUTHENTICATED', async () => {
      const res = await http().get('/api/v1/notifications').expect(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('UC42 PATCH /notifications/{id}/read', () => {
    it('đánh dấu đã đọc; gửi lặp vẫn 200', async () => {
      const res = await http()
        .patch(`/api/v1/notifications/${ID.n2}/read`)
        .set('Authorization', an())
        .expect(200);
      expect(res.body).toMatchObject({ id: ID.n2, isRead: true });
      await http().patch(`/api/v1/notifications/${ID.n2}/read`).set('Authorization', an()).expect(200);
      const list = await http().get('/api/v1/notifications').set('Authorization', an()).expect(200);
      expect(list.body.meta.unreadCount).toBe(1);
    });

    it('thông báo của người khác hoặc không có: 404 NOT_FOUND, không đổi dữ liệu', async () => {
      const res = await http()
        .patch(`/api/v1/notifications/${ID.binhNote}/read`)
        .set('Authorization', an())
        .expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect((await prisma.notification.findUniqueOrThrow({ where: { id: ID.binhNote } })).isRead).toBe(
        false,
      );
      await http().patch(`/api/v1/notifications/${UNKNOWN_ID}/read`).set('Authorization', an()).expect(404);
      await http().patch('/api/v1/notifications/abc/read').set('Authorization', an()).expect(404);
    });

    it('không token: 401', async () => {
      await http().patch(`/api/v1/notifications/${ID.n3}/read`).expect(401);
    });
  });
});
