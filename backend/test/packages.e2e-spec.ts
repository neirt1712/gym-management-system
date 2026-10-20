import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { AccessTokenPayload } from '../src/common/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';

/*
 * Test tích hợp với Postgres thật, chạy trên DB riêng `gym_test` (không đụng DB dev `gym`).
 * Chuẩn bị một lần:
 *   docker exec gym-postgres psql -U gym -d gym -c "CREATE DATABASE gym_test;"
 *   DATABASE_URL=postgresql://gym:gym@localhost:5432/gym_test?schema=public npx prisma migrate deploy
 * Đổi DB bằng biến TEST_DATABASE_URL. Test xóa sạch dữ liệu trước khi chạy nên tên DB bắt buộc kết thúc bằng `_test`.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://gym:gym@localhost:5432/gym_test?schema=public';
if (!new URL(TEST_DATABASE_URL).pathname.endsWith('_test')) {
  throw new Error(`TEST_DATABASE_URL phải trỏ tới DB tên *_test, đang là ${TEST_DATABASE_URL}`);
}
process.env.DATABASE_URL = TEST_DATABASE_URL;

const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

const gymBody = {
  name: 'Gym 3 tháng',
  type: 'GYM',
  price: 800000,
  durationValue: 3,
  durationUnit: 'MONTH',
  includesClass: false,
  benefits: ['Tủ đồ'],
};

const ptBody = {
  name: 'PT 12 buổi',
  type: 'PT',
  price: 3600000,
  durationValue: 2,
  durationUnit: 'MONTH',
  totalSessions: 12,
  sessionMinutes: 60,
  includesClass: true,
};

describe('Gói tập (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  const tokenFor = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;
  const admin = () => tokenFor({ sub: ADMIN_ID, role: 'ADMIN', tv: 0 });
  const member = () => tokenFor({ sub: '00000000-0000-4000-8000-000000000002', role: 'MEMBER', tv: 0 });
  const staff = () => tokenFor({ sub: '00000000-0000-4000-8000-000000000003', role: 'STAFF', tv: 0 });
  const http = () => request(app.getHttpServer());

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
    await prisma.user.create({
      data: { id: ADMIN_ID, phone: '0900000001', fullName: 'Admin test', role: 'ADMIN' },
    });
    await prisma.package.createMany({
      data: [
        { name: 'Gym 1 tháng', type: 'GYM', price: 300000, durationValue: 1, durationUnit: 'MONTH' },
        {
          name: 'Gym 3 tháng kèm lớp',
          type: 'GYM',
          price: 800000,
          durationValue: 3,
          durationUnit: 'MONTH',
          includesClass: true,
        },
        {
          name: 'PT 12 buổi',
          type: 'PT',
          price: 3600000,
          durationValue: 2,
          durationUnit: 'MONTH',
          totalSessions: 12,
          sessionMinutes: 60,
        },
        {
          name: 'Gym 7 ngày (ngừng bán)',
          type: 'GYM',
          price: 100000,
          durationValue: 7,
          durationUnit: 'DAY',
          status: 'INACTIVE',
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC07 GET /packages', () => {
    it('khách chỉ thấy gói ACTIVE, giá tăng dần, có meta', async () => {
      const res = await http().get('/api/v1/packages').expect(200);
      expect(res.body.data.map((p: { price: number }) => p.price)).toEqual([300000, 800000, 3600000]);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 3, totalPages: 1 });
      expect(res.body.data[0]).toEqual({
        id: expect.any(String),
        name: 'Gym 1 tháng',
        description: null,
        type: 'GYM',
        price: 300000,
        durationValue: 1,
        durationUnit: 'MONTH',
        totalSessions: null,
        sessionMinutes: null,
        includesClass: false,
        benefits: [],
        status: 'ACTIVE',
      });
    });

    it('tìm không dấu, không phân biệt hoa thường', async () => {
      const res = await http().get('/api/v1/packages').query({ q: 'GYM 3 THANG' }).expect(200);
      expect(res.body.data.map((p: { name: string }) => p.name)).toEqual(['Gym 3 tháng kèm lớp']);
    });

    it('ký tự % trong từ khóa được hiểu là chữ, không phải ký tự đại diện', async () => {
      const res = await http().get('/api/v1/packages').query({ q: '%' }).expect(200);
      expect(res.body.data).toEqual([]);
    });

    it('lọc theo loại, khoảng giá, thời hạn', async () => {
      const byType = await http().get('/api/v1/packages').query({ type: 'PT' }).expect(200);
      expect(byType.body.data.map((p: { name: string }) => p.name)).toEqual(['PT 12 buổi']);

      const byPrice = await http()
        .get('/api/v1/packages')
        .query({ minPrice: 500000, maxPrice: 1000000 })
        .expect(200);
      expect(byPrice.body.data.map((p: { price: number }) => p.price)).toEqual([800000]);

      const byDuration = await http()
        .get('/api/v1/packages')
        .query({ durationUnit: 'MONTH', durationValue: 3 })
        .expect(200);
      expect(byDuration.body.meta.total).toBe(1);
    });

    it('phân trang', async () => {
      const res = await http().get('/api/v1/packages').query({ page: 2, pageSize: 2 }).expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toEqual({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
    });

    it('Admin thấy cả gói ngừng bán và lọc được theo status', async () => {
      const all = await http().get('/api/v1/packages').set('Authorization', admin()).expect(200);
      expect(all.body.meta.total).toBe(4);

      const inactive = await http()
        .get('/api/v1/packages')
        .query({ status: 'INACTIVE' })
        .set('Authorization', admin())
        .expect(200);
      expect(inactive.body.data.map((p: { status: string }) => p.status)).toEqual(['INACTIVE']);
    });

    it('hội viên gửi status=INACTIVE vẫn chỉ thấy gói ACTIVE', async () => {
      const res = await http()
        .get('/api/v1/packages')
        .query({ status: 'INACTIVE' })
        .set('Authorization', member())
        .expect(200);
      expect(res.body.data.every((p: { status: string }) => p.status === 'ACTIVE')).toBe(true);
    });

    it('token sai trên endpoint công khai thì coi như khách', async () => {
      const res = await http().get('/api/v1/packages').set('Authorization', 'Bearer sai.token').expect(200);
      expect(res.body.meta.total).toBe(3);
    });

    it('pageSize quá 100 thì VALIDATION_ERROR', async () => {
      const res = await http().get('/api/v1/packages').query({ pageSize: 101 }).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toBe('pageSize');
    });
  });

  describe('UC07 GET /packages/{id}', () => {
    it('khách xem được cả gói ngừng bán', async () => {
      const pkg = await prisma.package.findFirstOrThrow({ where: { status: 'INACTIVE' } });
      const res = await http().get(`/api/v1/packages/${pkg.id}`).expect(200);
      expect(res.body).toMatchObject({ id: pkg.id, status: 'INACTIVE' });
    });

    it('không có gói thì NOT_FOUND, kể cả id không phải UUID', async () => {
      const res = await http().get(`/api/v1/packages/${UNKNOWN_ID}`).expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
      await http().get('/api/v1/packages/khong-phai-uuid').expect(404);
    });
  });

  describe('UC08 POST /packages', () => {
    it('Admin tạo gói PT, gói mới ACTIVE, có audit', async () => {
      const res = await http()
        .post('/api/v1/packages')
        .set('Authorization', admin())
        .send(ptBody)
        .expect(201);
      expect(res.body).toMatchObject({ ...ptBody, status: 'ACTIVE', description: null, benefits: [] });

      const log = await prisma.auditLog.findFirstOrThrow({ where: { targetId: res.body.id } });
      expect(log).toMatchObject({
        actorId: ADMIN_ID,
        action: 'PACKAGE_CREATE',
        targetType: 'package',
        before: null,
      });
      expect(log.after).toMatchObject({ price: 3600000, totalSessions: 12 });
    });

    it('không phải Admin thì FORBIDDEN, chưa đăng nhập thì UNAUTHENTICATED', async () => {
      const res = await http()
        .post('/api/v1/packages')
        .set('Authorization', member())
        .send(gymBody)
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      await http().post('/api/v1/packages').send(gymBody).expect(401);
    });

    it('gói PT thiếu số buổi thì VALIDATION_ERROR', async () => {
      const res = await http()
        .post('/api/v1/packages')
        .set('Authorization', admin())
        .send({ ...ptBody, totalSessions: undefined })
        .expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toEqual([{ field: 'totalSessions', messages: [expect.any(String)] }]);
    });

    it('gói GYM có số buổi thì VALIDATION_ERROR', async () => {
      const res = await http()
        .post('/api/v1/packages')
        .set('Authorization', admin())
        .send({ ...gymBody, totalSessions: 5 })
        .expect(400);
      expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(['totalSessions']);
    });
  });

  describe('UC08 PATCH /packages/{id}', () => {
    it('Admin sửa giá, ngừng bán; audit ghi trước và sau', async () => {
      const pkg = await prisma.package.findFirstOrThrow({ where: { name: 'Gym 1 tháng' } });
      const res = await http()
        .patch(`/api/v1/packages/${pkg.id}`)
        .set('Authorization', admin())
        .send({ price: 350000, status: 'INACTIVE' })
        .expect(200);
      expect(res.body).toMatchObject({ id: pkg.id, price: 350000, status: 'INACTIVE', name: 'Gym 1 tháng' });

      const log = await prisma.auditLog.findFirstOrThrow({
        where: { targetId: pkg.id, action: 'PACKAGE_UPDATE' },
      });
      expect(log.before).toMatchObject({ price: 300000, status: 'ACTIVE' });
      expect(log.after).toMatchObject({ price: 350000, status: 'INACTIVE' });
    });

    it('gửi type hoặc body rỗng thì VALIDATION_ERROR', async () => {
      const pkg = await prisma.package.findFirstOrThrow({ where: { type: 'GYM' } });
      const withType = await http()
        .patch(`/api/v1/packages/${pkg.id}`)
        .set('Authorization', admin())
        .send({ type: 'PT' })
        .expect(400);
      expect(withType.body.error.code).toBe('VALIDATION_ERROR');

      await http().patch(`/api/v1/packages/${pkg.id}`).set('Authorization', admin()).send({}).expect(400);
    });

    it('xóa số buổi của gói PT thì VALIDATION_ERROR', async () => {
      const pkg = await prisma.package.findFirstOrThrow({ where: { type: 'PT' } });
      const res = await http()
        .patch(`/api/v1/packages/${pkg.id}`)
        .set('Authorization', admin())
        .send({ totalSessions: null })
        .expect(400);
      expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(['totalSessions']);
    });

    it('gửi null cho field không được null thì VALIDATION_ERROR, không phải 500', async () => {
      const pkg = await prisma.package.findFirstOrThrow({ where: { type: 'GYM' } });
      const res = await http()
        .patch(`/api/v1/packages/${pkg.id}`)
        .set('Authorization', admin())
        .send({ name: null, price: null, status: null })
        .expect(400);
      expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(
        expect.arrayContaining(['name', 'price', 'status']),
      );

      // description được phép null
      await http()
        .patch(`/api/v1/packages/${pkg.id}`)
        .set('Authorization', admin())
        .send({ description: null })
        .expect(200);
    });

    it('Staff sửa thì FORBIDDEN; gói không tồn tại thì NOT_FOUND', async () => {
      await http()
        .patch(`/api/v1/packages/${UNKNOWN_ID}`)
        .set('Authorization', staff())
        .send({ price: 1 })
        .expect(403);
      const res = await http()
        .patch(`/api/v1/packages/${UNKNOWN_ID}`)
        .set('Authorization', admin())
        .send({ price: 1 })
        .expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
