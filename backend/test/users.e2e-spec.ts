import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { AccessTokenPayload } from '../src/common/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';

/*
 * Test tích hợp trên DB riêng `gym_test` (cách chuẩn bị: xem đầu test/packages.e2e-spec.ts).
 * Test xóa sạch dữ liệu trước khi chạy nên tên DB bắt buộc kết thúc bằng `_test`.
 * Người dùng là dòng thật trong DB (JwtAuthGuard sẽ so token_version với DB).
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
  ptBusyUser: '00000000-0000-4000-8000-000000000003',
  ptFreeUser: '00000000-0000-4000-8000-000000000004',
  memberUser: '00000000-0000-4000-8000-000000000005',
  ptBusy: '20000000-0000-4000-8000-000000000003',
  ptFree: '20000000-0000-4000-8000-000000000004',
};
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

describe('Tài khoản (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  const tokenFor = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;
  const admin = () => tokenFor({ sub: ID.admin, role: 'ADMIN', tv: 0 });
  const staff = () => tokenFor({ sub: ID.staff, role: 'STAFF', tv: 0 });
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
    await prisma.user.createMany({
      data: [
        {
          id: ID.admin,
          phone: '0900000001',
          fullName: 'Quản trị',
          role: 'ADMIN',
          createdAt: new Date('2026-10-01T01:00:00Z'),
        },
        {
          id: ID.staff,
          phone: '0900000011',
          fullName: 'Lễ tân Hòa',
          email: 'hoa@gym.local',
          role: 'STAFF',
          shift: 'Ca sáng',
          createdAt: new Date('2026-10-02T01:00:00Z'),
        },
        {
          id: ID.ptBusyUser,
          phone: '0900000021',
          fullName: 'PT Bận Lịch',
          role: 'TRAINER',
          createdAt: new Date('2026-10-03T01:00:00Z'),
        },
        {
          id: ID.ptFreeUser,
          phone: '0900000022',
          fullName: 'PT Rảnh',
          role: 'TRAINER',
          createdAt: new Date('2026-10-04T01:00:00Z'),
        },
        {
          id: ID.memberUser,
          phone: '0901234567',
          fullName: 'Nguyễn Văn An',
          role: 'MEMBER',
          createdAt: new Date('2026-10-05T01:00:00Z'),
        },
      ],
    });
    await prisma.member.create({
      data: { userId: ID.memberUser, memberCode: 'HV000001', qrToken: 'qr-an' },
    });
    await prisma.trainer.createMany({
      data: [
        { id: ID.ptBusy, userId: ID.ptBusyUser, specialties: ['Yoga'] },
        { id: ID.ptFree, userId: ID.ptFreeUser },
      ],
    });
    // PT bận có một lớp trong tương lai: không đổi được vai trò
    const start = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await prisma.class.create({
      data: {
        name: 'Yoga sáng',
        trainerId: ID.ptBusy,
        capacity: 10,
        startsAt: start,
        endsAt: new Date(start.getTime() + 60 * 60 * 1000),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC31 GET /users', () => {
    it('Admin thấy mọi vai trò, mới nhất trước, có meta và hồ sơ PT', async () => {
      const res = await http().get('/api/v1/users').set('Authorization', admin()).expect(200);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 5, totalPages: 1 });
      expect(res.body.data.map((u: { fullName: string }) => u.fullName)).toEqual([
        'Nguyễn Văn An',
        'PT Rảnh',
        'PT Bận Lịch',
        'Lễ tân Hòa',
        'Quản trị',
      ]);
      const busy = res.body.data.find((u: { id: string }) => u.id === ID.ptBusyUser);
      expect(busy).toEqual({
        id: ID.ptBusyUser,
        fullName: 'PT Bận Lịch',
        phone: '0900000021',
        email: null,
        dob: null,
        avatarUrl: null,
        role: 'TRAINER',
        status: 'ACTIVE',
        shift: null,
        trainer: { id: ID.ptBusy, specialties: ['Yoga'], bio: null, experienceYears: null, status: 'ACTIVE' },
        createdAt: '2026-10-03T08:00:00+07:00',
      });
      expect(busy).not.toHaveProperty('passwordHash');
    });

    it('lọc role và tìm tên không dấu', async () => {
      const byRole = await http().get('/api/v1/users?role=TRAINER').set('Authorization', admin()).expect(200);
      expect(byRole.body.meta.total).toBe(2);

      const byName = await http().get('/api/v1/users?q=le tan').set('Authorization', admin()).expect(200);
      expect(byName.body.data.map((u: { id: string }) => u.id)).toEqual([ID.staff]);
    });

    it('role sai giá trị: 400 VALIDATION_ERROR', async () => {
      const res = await http().get('/api/v1/users?role=BOSS').set('Authorization', admin()).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Staff gọi: 403 FORBIDDEN; không token: 401', async () => {
      const res = await http().get('/api/v1/users').set('Authorization', staff()).expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      await http().get('/api/v1/users').expect(401);
    });
  });

  describe('UC31 GET /users/{id}', () => {
    it('Admin xem chi tiết Staff', async () => {
      const res = await http().get(`/api/v1/users/${ID.staff}`).set('Authorization', admin()).expect(200);
      expect(res.body).toMatchObject({ id: ID.staff, role: 'STAFF', shift: 'Ca sáng', trainer: null });
    });

    it('không có: 404 NOT_FOUND (cả id không phải uuid)', async () => {
      const res = await http().get(`/api/v1/users/${UNKNOWN_ID}`).set('Authorization', admin()).expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
      await http().get('/api/v1/users/abc').set('Authorization', admin()).expect(404);
    });

    it('Staff gọi: 403 FORBIDDEN', async () => {
      await http().get(`/api/v1/users/${ID.staff}`).set('Authorization', staff()).expect(403);
    });
  });

  describe('UC32 POST /users', () => {
    it('tạo PT kèm hồ sơ, mật khẩu được băm', async () => {
      const res = await http()
        .post('/api/v1/users')
        .set('Authorization', admin())
        .send({
          role: 'TRAINER',
          fullName: 'Lê Minh Cường',
          phone: '0900000003',
          email: 'cuong.pt@example.com',
          password: 'matkhau123',
          trainer: { specialties: ['Giảm mỡ', 'Tăng cơ'], bio: '5 năm kinh nghiệm', experienceYears: 5 },
        })
        .expect(201);
      expect(res.body).toMatchObject({
        role: 'TRAINER',
        fullName: 'Lê Minh Cường',
        shift: null,
        status: 'ACTIVE',
        trainer: {
          specialties: ['Giảm mỡ', 'Tăng cơ'],
          bio: '5 năm kinh nghiệm',
          experienceYears: 5,
          status: 'ACTIVE',
        },
      });
      const row = await prisma.user.findUniqueOrThrow({ where: { id: res.body.id } });
      expect(row.passwordHash).not.toBe('matkhau123');
      expect(await bcrypt.compare('matkhau123', row.passwordHash ?? '')).toBe(true);
    });

    it('tạo Staff có ca làm', async () => {
      const res = await http()
        .post('/api/v1/users')
        .set('Authorization', admin())
        .send({
          role: 'STAFF',
          fullName: 'Lễ tân Mai',
          phone: '0900000012',
          password: 'matkhau123',
          shift: 'Ca tối',
        })
        .expect(201);
      expect(res.body).toMatchObject({ role: 'STAFF', shift: 'Ca tối', trainer: null, email: null });
    });

    it('PT thiếu trainer, role MEMBER, mật khẩu ngắn: 400 VALIDATION_ERROR', async () => {
      const base = { fullName: 'X', phone: '0900000099', password: 'matkhau123' };
      const noTrainer = await http()
        .post('/api/v1/users')
        .set('Authorization', admin())
        .send({ ...base, role: 'TRAINER' })
        .expect(400);
      expect(noTrainer.body.error.details).toEqual([{ field: 'trainer', messages: expect.any(Array) }]);
      await http()
        .post('/api/v1/users')
        .set('Authorization', admin())
        .send({ ...base, role: 'MEMBER' })
        .expect(400);
      await http()
        .post('/api/v1/users')
        .set('Authorization', admin())
        .send({ ...base, role: 'STAFF', password: 'ngan' })
        .expect(400);
    });

    it('SĐT trùng: 409 PHONE_DUPLICATED; email trùng: 409 EMAIL_DUPLICATED', async () => {
      const phone = await http()
        .post('/api/v1/users')
        .set('Authorization', admin())
        .send({ role: 'STAFF', fullName: 'Trùng', phone: '0900000011', password: 'matkhau123' })
        .expect(409);
      expect(phone.body.error.code).toBe('PHONE_DUPLICATED');
      const email = await http()
        .post('/api/v1/users')
        .set('Authorization', admin())
        .send({
          role: 'STAFF',
          fullName: 'Trùng',
          phone: '0900000098',
          email: 'hoa@gym.local',
          password: 'matkhau123',
        })
        .expect(409);
      expect(email.body.error.code).toBe('EMAIL_DUPLICATED');
    });

    it('Staff gọi: 403 FORBIDDEN', async () => {
      await http()
        .post('/api/v1/users')
        .set('Authorization', staff())
        .send({ role: 'STAFF', fullName: 'X', phone: '0900000097', password: 'matkhau123' })
        .expect(403);
    });
  });

  describe('UC33 PATCH /users/{id}', () => {
    it('đổi tên và ca của Staff', async () => {
      const res = await http()
        .patch(`/api/v1/users/${ID.staff}`)
        .set('Authorization', admin())
        .send({ fullName: 'Lễ tân Hòa Bình', shift: 'Ca chiều' })
        .expect(200);
      expect(res.body).toMatchObject({ fullName: 'Lễ tân Hòa Bình', shift: 'Ca chiều' });
    });

    it('body rỗng, shift cho PT, field lạ: 400 VALIDATION_ERROR', async () => {
      await http().patch(`/api/v1/users/${ID.staff}`).set('Authorization', admin()).send({}).expect(400);
      await http()
        .patch(`/api/v1/users/${ID.ptFreeUser}`)
        .set('Authorization', admin())
        .send({ shift: 'Ca sáng' })
        .expect(400);
      await http()
        .patch(`/api/v1/users/${ID.staff}`)
        .set('Authorization', admin())
        .send({ role: 'ADMIN' })
        .expect(400);
    });

    it('SĐT của người khác: 409 PHONE_DUPLICATED', async () => {
      const res = await http()
        .patch(`/api/v1/users/${ID.staff}`)
        .set('Authorization', admin())
        .send({ phone: '0900000021' })
        .expect(409);
      expect(res.body.error.code).toBe('PHONE_DUPLICATED');
    });

    it('không có: 404; Staff gọi: 403', async () => {
      await http()
        .patch(`/api/v1/users/${UNKNOWN_ID}`)
        .set('Authorization', admin())
        .send({ fullName: 'A' })
        .expect(404);
      await http()
        .patch(`/api/v1/users/${ID.staff}`)
        .set('Authorization', staff())
        .send({ fullName: 'A' })
        .expect(403);
    });
  });

  describe('UC34 PATCH /users/{id}/status', () => {
    it('khóa: tăng token_version, ghi audit USER_LOCK; mở lại: USER_UNLOCK', async () => {
      const res = await http()
        .patch(`/api/v1/users/${ID.staff}/status`)
        .set('Authorization', admin())
        .send({ status: 'LOCKED', reason: 'Nghỉ việc từ 01/11' })
        .expect(200);
      expect(res.body.status).toBe('LOCKED');
      const row = await prisma.user.findUniqueOrThrow({ where: { id: ID.staff } });
      expect(row.tokenVersion).toBe(1);
      const lock = await prisma.auditLog.findFirstOrThrow({
        where: { targetId: ID.staff, action: 'USER_LOCK' },
      });
      expect(lock).toMatchObject({
        actorId: ID.admin,
        targetType: 'user',
        before: { status: 'ACTIVE' },
        after: { status: 'LOCKED' },
        reason: 'Nghỉ việc từ 01/11',
      });

      await http()
        .patch(`/api/v1/users/${ID.staff}/status`)
        .set('Authorization', admin())
        .send({ status: 'ACTIVE', reason: 'Đi làm lại' })
        .expect(200);
      expect(await prisma.auditLog.count({ where: { targetId: ID.staff, action: 'USER_UNLOCK' } })).toBe(1);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: ID.staff } })).tokenVersion).toBe(1);
    });

    it('Admin tự khóa mình: 403 FORBIDDEN', async () => {
      const res = await http()
        .patch(`/api/v1/users/${ID.admin}/status`)
        .set('Authorization', admin())
        .send({ status: 'LOCKED', reason: 'Thử' })
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('thiếu reason: 400; không có: 404; Staff gọi: 403', async () => {
      await http()
        .patch(`/api/v1/users/${ID.staff}/status`)
        .set('Authorization', admin())
        .send({ status: 'LOCKED' })
        .expect(400);
      await http()
        .patch(`/api/v1/users/${UNKNOWN_ID}/status`)
        .set('Authorization', admin())
        .send({ status: 'LOCKED', reason: 'x' })
        .expect(404);
      await http()
        .patch(`/api/v1/users/${ID.ptFreeUser}/status`)
        .set('Authorization', staff())
        .send({ status: 'LOCKED', reason: 'x' })
        .expect(403);
    });
  });

  describe('UC35 PATCH /users/{id}/role', () => {
    it('PT rảnh sang STAFF: hồ sơ PT ngừng, tăng token_version, ghi audit', async () => {
      const res = await http()
        .patch(`/api/v1/users/${ID.ptFreeUser}/role`)
        .set('Authorization', admin())
        .send({ role: 'STAFF', reason: 'Chuyển sang làm quầy' })
        .expect(200);
      expect(res.body).toMatchObject({ role: 'STAFF', trainer: null });
      expect((await prisma.trainer.findUniqueOrThrow({ where: { id: ID.ptFree } })).status).toBe('INACTIVE');
      expect((await prisma.user.findUniqueOrThrow({ where: { id: ID.ptFreeUser } })).tokenVersion).toBe(1);
      const log = await prisma.auditLog.findFirstOrThrow({
        where: { targetId: ID.ptFreeUser, action: 'USER_ROLE_CHANGE' },
      });
      expect(log).toMatchObject({ before: { role: 'TRAINER' }, after: { role: 'STAFF' } });
    });

    it('Staff sang TRAINER: bật lại hồ sơ PT cũ', async () => {
      const res = await http()
        .patch(`/api/v1/users/${ID.ptFreeUser}/role`)
        .set('Authorization', admin())
        .send({ role: 'TRAINER', reason: 'Quay lại làm PT' })
        .expect(200);
      expect(res.body.trainer).toMatchObject({ id: ID.ptFree, status: 'ACTIVE' });
    });

    it('đổi từ hoặc sang MEMBER: 422 ROLE_CHANGE_NOT_ALLOWED', async () => {
      const toMember = await http()
        .patch(`/api/v1/users/${ID.staff}/role`)
        .set('Authorization', admin())
        .send({ role: 'MEMBER', reason: 'x' })
        .expect(422);
      expect(toMember.body.error.code).toBe('ROLE_CHANGE_NOT_ALLOWED');
      const fromMember = await http()
        .patch(`/api/v1/users/${ID.memberUser}/role`)
        .set('Authorization', admin())
        .send({ role: 'STAFF', reason: 'x' })
        .expect(422);
      expect(fromMember.body.error.code).toBe('ROLE_CHANGE_NOT_ALLOWED');
    });

    it('PT còn lớp trong tương lai: 422 ROLE_CHANGE_NOT_ALLOWED, vai trò giữ nguyên', async () => {
      const res = await http()
        .patch(`/api/v1/users/${ID.ptBusyUser}/role`)
        .set('Authorization', admin())
        .send({ role: 'STAFF', reason: 'x' })
        .expect(422);
      expect(res.body.error.code).toBe('ROLE_CHANGE_NOT_ALLOWED');
      expect((await prisma.user.findUniqueOrThrow({ where: { id: ID.ptBusyUser } })).role).toBe('TRAINER');
    });

    it('thiếu reason: 400; không có: 404; Staff gọi: 403', async () => {
      await http()
        .patch(`/api/v1/users/${ID.staff}/role`)
        .set('Authorization', admin())
        .send({ role: 'ADMIN' })
        .expect(400);
      await http()
        .patch(`/api/v1/users/${UNKNOWN_ID}/role`)
        .set('Authorization', admin())
        .send({ role: 'ADMIN', reason: 'x' })
        .expect(404);
      await http()
        .patch(`/api/v1/users/${ID.staff}/role`)
        .set('Authorization', staff())
        .send({ role: 'ADMIN', reason: 'x' })
        .expect(403);
    });
  });
});
