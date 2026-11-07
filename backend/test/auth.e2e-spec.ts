import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/*
 * Test tích hợp trên DB riêng `gym_test` (cách chuẩn bị: xem đầu test/packages.e2e-spec.ts).
 * Test xóa sạch dữ liệu trước khi chạy nên tên DB bắt buộc kết thúc bằng `_test`.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://gym:gym@localhost:5432/gym_test?schema=public';
if (!new URL(TEST_DATABASE_URL).pathname.endsWith('_test')) {
  throw new Error('TEST_DATABASE_URL phải trỏ tới DB tên *_test');
}
process.env.DATABASE_URL = TEST_DATABASE_URL;

const PASSWORD = 'matkhau123';
const registerBody = { fullName: 'Nguyễn Văn An', phone: '0901234567', password: PASSWORD };

describe('Xác thực và hồ sơ (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  const login = (phone: string, password = PASSWORD) =>
    http().post('/api/v1/auth/login').send({ phone, password });
  const refreshCookieOf = (res: request.Response): string =>
    (res.headers['set-cookie'] as unknown as string[])
      .find((c) => c.startsWith('refresh_token='))!
      .split(';')[0];

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async () => {
    // TRUNCATE không chạy trigger chặn DELETE của audit_logs, nên xóa sạch được DB test
    await prisma.$executeRawUnsafe('TRUNCATE packages, audit_logs, users RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC01 đăng ký', () => {
    it('tạo tài khoản MEMBER kèm hồ sơ và đăng nhập luôn', async () => {
      const res = await http().post('/api/v1/auth/register').send(registerBody).expect(201);

      expect(res.body.expiresIn).toBe(900);
      expect(res.body.user).toMatchObject({ role: 'MEMBER', phone: registerBody.phone, email: null });
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(refreshCookieOf(res)).toMatch(/^refresh_token=.+/);
      const member = await prisma.member.findFirstOrThrow();
      expect(member.memberCode).toBe('HV000001');
    });

    it('SĐT đã có thì PHONE_DUPLICATED', async () => {
      await http().post('/api/v1/auth/register').send(registerBody).expect(201);
      const res = await http().post('/api/v1/auth/register').send(registerBody).expect(409);
      expect(res.body.error.code).toBe('PHONE_DUPLICATED');
    });

    it('email đã có thì EMAIL_DUPLICATED', async () => {
      await http()
        .post('/api/v1/auth/register')
        .send({ ...registerBody, email: 'an@example.com' })
        .expect(201);
      const res = await http()
        .post('/api/v1/auth/register')
        .send({ ...registerBody, phone: '0901234568', email: 'an@example.com' })
        .expect(409);
      expect(res.body.error.code).toBe('EMAIL_DUPLICATED');
    });

    it('hồ sơ tại quầy chưa kích hoạt thì ACTIVATION_REQUIRED', async () => {
      await prisma.user.create({ data: { phone: registerBody.phone, fullName: 'Tại quầy', role: 'MEMBER' } });
      const res = await http().post('/api/v1/auth/register').send(registerBody).expect(409);
      expect(res.body.error.code).toBe('ACTIVATION_REQUIRED');
    });

    it('mật khẩu ngắn thì VALIDATION_ERROR', async () => {
      const res = await http()
        .post('/api/v1/auth/register')
        .send({ ...registerBody, password: 'ngan' })
        .expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('hai yêu cầu cùng SĐT song song chỉ một cái thành công', async () => {
      const results = await Promise.all([
        http().post('/api/v1/auth/register').send(registerBody),
        http().post('/api/v1/auth/register').send(registerBody),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    });
  });

  describe('UC02 đăng nhập', () => {
    beforeEach(async () => {
      await http().post('/api/v1/auth/register').send(registerBody).expect(201);
    });

    it('đúng mật khẩu thì trả phiên và cookie HttpOnly', async () => {
      const res = await login(registerBody.phone).expect(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      const cookie = (res.headers['set-cookie'] as unknown as string[])[0];
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/api/v1/auth');
    });

    it('sai mật khẩu hoặc SĐT lạ thì INVALID_CREDENTIALS', async () => {
      const wrong = await login(registerBody.phone, 'saimatkhau').expect(401);
      expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
      const unknown = await login('0999999999').expect(401);
      expect(unknown.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('sai 5 lần thì khóa tạm kèm retryAfterSeconds, mật khẩu đúng vẫn bị chặn', async () => {
      for (let i = 0; i < 4; i += 1) await login(registerBody.phone, 'saimatkhau').expect(401);
      const locked = await login(registerBody.phone, 'saimatkhau').expect(429);
      expect(locked.body.error.code).toBe('ACCOUNT_TEMPORARILY_LOCKED');
      expect(locked.body.error.details.retryAfterSeconds).toBeGreaterThan(0);
      await login(registerBody.phone).expect(429);
    });

    it('đăng nhập đúng thì đếm lại số lần sai từ 0', async () => {
      for (let i = 0; i < 4; i += 1) await login(registerBody.phone, 'saimatkhau').expect(401);
      await login(registerBody.phone).expect(200);
      await login(registerBody.phone, 'saimatkhau').expect(401);
      const user = await prisma.user.findUniqueOrThrow({ where: { phone: registerBody.phone } });
      expect(user.failedLogins).toBe(1);
    });

    it('tài khoản bị Admin khóa thì ACCOUNT_LOCKED', async () => {
      await prisma.user.update({ where: { phone: registerBody.phone }, data: { status: 'LOCKED' } });
      const res = await login(registerBody.phone).expect(403);
      expect(res.body.error.code).toBe('ACCOUNT_LOCKED');
    });

    it('hồ sơ chưa kích hoạt thì báo như sai mật khẩu', async () => {
      await prisma.user.create({ data: { phone: '0901111111', fullName: 'Tại quầy', role: 'MEMBER' } });
      const res = await login('0901111111').expect(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Phiên', () => {
    it('refresh đổi cookie mới; thiếu cookie thì 401', async () => {
      const reg = await http().post('/api/v1/auth/register').send(registerBody).expect(201);
      const res = await http().post('/api/v1/auth/refresh').set('Cookie', refreshCookieOf(reg)).expect(200);
      expect(res.body.user.phone).toBe(registerBody.phone);
      expect(refreshCookieOf(res)).toMatch(/^refresh_token=.+/);
      await http().post('/api/v1/auth/refresh').expect(401);
    });

    it('access token không dùng làm refresh token được', async () => {
      const reg = await http().post('/api/v1/auth/register').send(registerBody).expect(201);
      await http()
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refresh_token=${reg.body.accessToken}`)
        .expect(401);
    });

    it('UC03 đăng xuất xóa cookie; chưa đăng nhập thì 401', async () => {
      const reg = await http().post('/api/v1/auth/register').send(registerBody).expect(201);
      const res = await http()
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${reg.body.accessToken}`)
        .expect(204);
      expect(refreshCookieOf(res)).toBe('refresh_token=');
      await http().post('/api/v1/auth/logout').expect(401);
    });

    it('khóa tài khoản thì thu hồi phiên đang có', async () => {
      const reg = await http().post('/api/v1/auth/register').send(registerBody).expect(201);
      await prisma.user.update({ where: { phone: registerBody.phone }, data: { status: 'LOCKED' } });
      await http().get('/api/v1/me').set('Authorization', `Bearer ${reg.body.accessToken}`).expect(401);
      await http().post('/api/v1/auth/refresh').set('Cookie', refreshCookieOf(reg)).expect(401);
    });
  });

  describe('UC06 đổi mật khẩu', () => {
    it('thu hồi phiên cũ, thiết bị hiện tại nhận phiên mới', async () => {
      const reg = await http().post('/api/v1/auth/register').send(registerBody).expect(201);
      const res = await http()
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${reg.body.accessToken}`)
        .send({ currentPassword: PASSWORD, newPassword: 'matkhaumoi456' })
        .expect(200);

      await http().get('/api/v1/me').set('Authorization', `Bearer ${reg.body.accessToken}`).expect(401);
      await http().post('/api/v1/auth/refresh').set('Cookie', refreshCookieOf(reg)).expect(401);
      await http().get('/api/v1/me').set('Authorization', `Bearer ${res.body.accessToken}`).expect(200);
      await login(registerBody.phone, 'matkhaumoi456').expect(200);
    });

    it('sai mật khẩu hiện tại thì 400, field currentPassword', async () => {
      const reg = await http().post('/api/v1/auth/register').send(registerBody).expect(201);
      const res = await http()
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${reg.body.accessToken}`)
        .send({ currentPassword: 'saimatkhau', newPassword: 'matkhaumoi456' })
        .expect(400);
      expect(res.body.error.details[0].field).toBe('currentPassword');
    });
  });

  describe('UC05 hồ sơ', () => {
    const tokenOf = async (): Promise<string> => {
      const reg = await http().post('/api/v1/auth/register').send(registerBody).expect(201);
      return `Bearer ${reg.body.accessToken as string}`;
    };

    it('GET /me của MEMBER có qrToken, trainer là null', async () => {
      const res = await http()
        .get('/api/v1/me')
        .set('Authorization', await tokenOf())
        .expect(200);
      expect(res.body.member).toMatchObject({ memberCode: 'HV000001', hasActiveSubscription: false });
      expect(res.body.member.qrToken).toEqual(expect.any(String));
      expect(res.body.trainer).toBeNull();
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('chưa đăng nhập thì 401', async () => {
      await http().get('/api/v1/me').expect(401);
    });

    it('PATCH /me sửa field được gửi, email null để xóa', async () => {
      const token = await tokenOf();
      await http()
        .patch('/api/v1/me')
        .set('Authorization', token)
        .send({ email: 'an@example.com' })
        .expect(200);
      const res = await http()
        .patch('/api/v1/me')
        .set('Authorization', token)
        .send({ fullName: 'Tên mới', email: null, dob: '1998-05-20' })
        .expect(200);
      expect(res.body).toMatchObject({ fullName: 'Tên mới', email: null, dob: '1998-05-20' });
    });

    it('PATCH /me không đổi được SĐT, vai trò', async () => {
      const token = await tokenOf();
      await http().patch('/api/v1/me').set('Authorization', token).send({ phone: '0909999999' }).expect(400);
      await http().patch('/api/v1/me').set('Authorization', token).send({ role: 'ADMIN' }).expect(400);
    });

    it('PATCH /me rỗng hoặc MEMBER gửi nhóm trainer thì VALIDATION_ERROR', async () => {
      const token = await tokenOf();
      await http().patch('/api/v1/me').set('Authorization', token).send({}).expect(400);
      await http()
        .patch('/api/v1/me')
        .set('Authorization', token)
        .send({ trainer: { bio: 'x' } })
        .expect(400);
    });

    it('PATCH /me email đã có thì EMAIL_DUPLICATED', async () => {
      await prisma.user.create({
        data: { phone: '0902222222', fullName: 'Khác', role: 'MEMBER', email: 'trung@example.com' },
      });
      const res = await http()
        .patch('/api/v1/me')
        .set('Authorization', await tokenOf())
        .send({ email: 'trung@example.com' })
        .expect(409);
      expect(res.body.error.code).toBe('EMAIL_DUPLICATED');
    });

    it('PT sửa được nhóm trainer', async () => {
      const passwordHash = await bcrypt.hash(PASSWORD, 10);
      await prisma.user.create({
        data: { phone: '0903333333', fullName: 'PT', role: 'TRAINER', passwordHash, trainer: { create: {} } },
      });
      const session = await login('0903333333').expect(200);
      const res = await http()
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${session.body.accessToken}`)
        .send({ trainer: { bio: 'Giới thiệu', experienceYears: 3 } })
        .expect(200);
      expect(res.body.trainer).toMatchObject({ bio: 'Giới thiệu', experienceYears: 3 });
    });
  });

  describe('UC15 tạo lại mã QR', () => {
    it('MEMBER nhận mã mới, mã cũ hết hiệu lực', async () => {
      const reg = await http().post('/api/v1/auth/register').send(registerBody).expect(201);
      const token = `Bearer ${reg.body.accessToken as string}`;
      const before = await prisma.member.findFirstOrThrow();
      const res = await http().post('/api/v1/me/qr-token/regenerate').set('Authorization', token).expect(200);
      expect(res.body.qrToken).not.toBe(before.qrToken);
      const after = await prisma.member.findFirstOrThrow();
      expect(after.qrToken).toBe(res.body.qrToken);
    });

    it('vai trò khác thì 403', async () => {
      const passwordHash = await bcrypt.hash(PASSWORD, 10);
      await prisma.user.create({
        data: { phone: '0904444444', fullName: 'Staff', role: 'STAFF', passwordHash },
      });
      const session = await login('0904444444').expect(200);
      await http()
        .post('/api/v1/me/qr-token/regenerate')
        .set('Authorization', `Bearer ${session.body.accessToken}`)
        .expect(403);
    });
  });
});
