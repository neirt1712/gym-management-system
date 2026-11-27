import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { AccessTokenPayload } from '../src/common/auth/jwt-auth.guard';
import { MailService, type MailMessage } from '../src/common/mail/mail.service';
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
  lockedStaff: '00000000-0000-4000-8000-000000000003',
  anUser: '00000000-0000-4000-8000-000000000005',
  binhUser: '00000000-0000-4000-8000-000000000006',
  chiUser: '00000000-0000-4000-8000-000000000007',
  an: '10000000-0000-4000-8000-000000000005',
  binh: '10000000-0000-4000-8000-000000000006',
  chi: '10000000-0000-4000-8000-000000000007',
};
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

describe('Quên mật khẩu, đặt lại tại quầy, thông báo chủ động (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  const sent: MailMessage[] = [];
  const tokenFor = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;
  const admin = () => tokenFor({ sub: ID.admin, role: 'ADMIN', tv: 0 });
  const staff = () => tokenFor({ sub: ID.staff, role: 'STAFF', tv: 0 });
  const binh = () => tokenFor({ sub: ID.binhUser, role: 'MEMBER', tv: 0 });
  const http = () => request(app.getHttpServer());
  const tokenFromLastMail = () => /token=([0-9a-f]+)/.exec(sent[sent.length - 1].text)?.[1] ?? '';
  const login = (phone: string, password: string) =>
    http().post('/api/v1/auth/login').send({ phone, password });

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.APP_URL = 'http://fe.test';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    jwt = moduleRef.get(JwtService);
    prisma = moduleRef.get(PrismaService);
    // Không gửi thư thật: giữ lại để đọc link
    jest.spyOn(app.get(MailService), 'send').mockImplementation(async (m) => {
      sent.push(m);
      return true;
    });

    await prisma.$executeRawUnsafe('TRUNCATE packages, audit_logs, users RESTART IDENTITY CASCADE');
    const oldHash = await bcrypt.hash('matkhaucu123', 4);
    await prisma.user.createMany({
      data: [
        { id: ID.admin, phone: '0900000001', fullName: 'Quản trị', role: 'ADMIN' },
        { id: ID.staff, phone: '0900000002', fullName: 'Nhân viên', role: 'STAFF' },
        { id: ID.lockedStaff, phone: '0900000003', fullName: 'Đã nghỉ', role: 'STAFF', status: 'LOCKED' },
        // An có email; Bình không có email (Q15); Chi tạo tại quầy, chưa có mật khẩu
        {
          id: ID.anUser,
          phone: '0901234567',
          fullName: 'Nguyễn Văn An',
          role: 'MEMBER',
          email: 'an@gym.local',
          passwordHash: oldHash,
        },
        {
          id: ID.binhUser,
          phone: '0912345678',
          fullName: 'Trần Thị Bình',
          role: 'MEMBER',
          passwordHash: oldHash,
          failedLogins: 5,
          lockedUntil: new Date(Date.now() + 600_000),
        },
        { id: ID.chiUser, phone: '0923456789', fullName: 'Lê Chi', role: 'MEMBER', email: 'chi@gym.local' },
      ],
    });
    await prisma.member.createMany({
      data: [
        { id: ID.an, userId: ID.anUser, memberCode: 'HV000001', qrToken: 'qr-an' },
        { id: ID.binh, userId: ID.binhUser, memberCode: 'HV000002', qrToken: 'qr-binh' },
        { id: ID.chi, userId: ID.chiUser, memberCode: 'HV000003', qrToken: 'qr-chi' },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC04 POST /auth/forgot-password, /auth/reset-password', () => {
    it('SĐT không có, tài khoản không có email: vẫn 202, không gửi thư', async () => {
      await http().post('/api/v1/auth/forgot-password').send({ phone: '0999999999' }).expect(202);
      await http().post('/api/v1/auth/forgot-password').send({ phone: '0912345678' }).expect(202);
      expect(sent).toHaveLength(0);
      await http().post('/api/v1/auth/forgot-password').send({ phone: 'abc' }).expect(400);
    });

    it('có email: 202, gửi link FE kèm token, DB chỉ lưu hash; đặt mật khẩu mới: 204, đăng nhập bằng mật khẩu mới', async () => {
      await http().post('/api/v1/auth/forgot-password').send({ phone: '0901234567' }).expect(202);
      expect(sent).toHaveLength(1);
      expect(sent[0].to).toBe('an@gym.local');
      expect(sent[0].text).toContain('http://fe.test/reset-password?token=');
      const token = tokenFromLastMail();
      expect(await prisma.passwordResetToken.count({ where: { tokenHash: token } })).toBe(0);

      await http()
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'matkhaumoi456' })
        .expect(204);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: ID.anUser } });
      expect(user.tokenVersion).toBe(1);
      await login('0901234567', 'matkhaumoi456').expect(200);
      await login('0901234567', 'matkhaucu123').expect(401);

      // Dùng lại token: 400 TOKEN_EXPIRED
      const reused = await http()
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'khac12345' })
        .expect(400);
      expect(reused.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('token sai hoặc hết hạn: 400 TOKEN_EXPIRED; mật khẩu ngắn: 400 VALIDATION_ERROR', async () => {
      const wrong = await http()
        .post('/api/v1/auth/reset-password')
        .send({ token: 'sai', newPassword: 'matkhau123' })
        .expect(400);
      expect(wrong.body.error.code).toBe('TOKEN_EXPIRED');

      await http().post('/api/v1/auth/forgot-password').send({ phone: '0923456789' }).expect(202);
      const token = tokenFromLastMail();
      await http().post('/api/v1/auth/reset-password').send({ token, newPassword: 'ngan' }).expect(400);
      await prisma.passwordResetToken.updateMany({
        where: { userId: ID.chiUser },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      const expired = await http()
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'matkhau123' })
        .expect(400);
      expect(expired.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('kích hoạt tài khoản tạo tại quầy bằng link; hai request cùng token: chỉ một cái thành công', async () => {
      await http().post('/api/v1/auth/forgot-password').send({ phone: '0923456789' }).expect(202);
      expect(sent[sent.length - 1].subject).toContain('Kích hoạt');
      const token = tokenFromLastMail();
      const results = await Promise.all([
        http().post('/api/v1/auth/reset-password').send({ token, newPassword: 'matkhau111' }),
        http().post('/api/v1/auth/reset-password').send({ token, newPassword: 'matkhau222' }),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([204, 400]);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: ID.chiUser } });
      expect(user.passwordHash).not.toBeNull();
    });

    it('gọi quá 3 lần trong 15 phút cùng một SĐT: 429 RATE_LIMITED', async () => {
      // Chi đã gọi 2 lần ở trên
      await http().post('/api/v1/auth/forgot-password').send({ phone: '0923456789' }).expect(202);
      const res = await http().post('/api/v1/auth/forgot-password').send({ phone: '0923456789' }).expect(429);
      expect(res.body.error.code).toBe('RATE_LIMITED');
    });
  });

  describe('UC04 Q15 POST /members/{id}/reset-password', () => {
    it('Staff đặt mật khẩu cho khách không có email: 204, mở khóa tạm, thu hồi phiên, ghi audit', async () => {
      await http()
        .post(`/api/v1/members/${ID.binh}/reset-password`)
        .set('Authorization', staff())
        .send({ newPassword: 'matkhauquay1' })
        .expect(204);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: ID.binhUser } });
      expect(user).toMatchObject({ tokenVersion: 1, failedLogins: 0, lockedUntil: null });
      await login('0912345678', 'matkhauquay1').expect(200);
      expect(
        await prisma.auditLog.count({
          where: { targetId: ID.binhUser, action: 'MEMBER_PASSWORD_RESET', actorId: ID.staff },
        }),
      ).toBe(1);
    });

    it('hội viên tự gọi: 403 (token cũ cũng đã bị thu hồi: 401); không có: 404; mật khẩu ngắn: 400', async () => {
      await http()
        .post(`/api/v1/members/${ID.an}/reset-password`)
        .set('Authorization', tokenFor({ sub: ID.anUser, role: 'MEMBER', tv: 1 }))
        .send({ newPassword: 'matkhau123' })
        .expect(403);
      await http()
        .post(`/api/v1/members/${ID.binh}/reset-password`)
        .set('Authorization', binh())
        .send({ newPassword: 'matkhau123' })
        .expect(401);
      await http()
        .post(`/api/v1/members/${UNKNOWN_ID}/reset-password`)
        .set('Authorization', admin())
        .send({ newPassword: 'matkhau123' })
        .expect(404);
      await http()
        .post(`/api/v1/members/${ID.an}/reset-password`)
        .set('Authorization', admin())
        .send({ newPassword: 'ngan' })
        .expect(400);
    });
  });

  describe('UC43 POST /notifications/broadcast', () => {
    it('Admin gửi cho MEMBER và STAFF: 202 kèm số người nhận, bỏ tài khoản bị khóa', async () => {
      const res = await http()
        .post('/api/v1/notifications/broadcast')
        .set('Authorization', admin())
        .send({ title: 'Nghỉ lễ', body: 'Phòng tập đóng cửa ngày 20/11.', roles: ['MEMBER', 'STAFF'] })
        .expect(202);
      // 3 hội viên + 1 Staff ACTIVE (Staff bị khóa không nhận)
      expect(res.body).toEqual({ recipientCount: 4 });
      expect(await prisma.notification.count({ where: { type: 'BROADCAST', userId: ID.lockedStaff } })).toBe(
        0,
      );
      expect(await prisma.notification.count({ where: { type: 'BROADCAST', userId: ID.chiUser } })).toBe(1);
    });

    it('Staff gửi: 403; roles rỗng hoặc sai: 400', async () => {
      const body = { title: 'X', body: 'Y', roles: ['MEMBER'] };
      await http()
        .post('/api/v1/notifications/broadcast')
        .set('Authorization', staff())
        .send(body)
        .expect(403);
      await http()
        .post('/api/v1/notifications/broadcast')
        .set('Authorization', admin())
        .send({ ...body, roles: [] })
        .expect(400);
      await http()
        .post('/api/v1/notifications/broadcast')
        .set('Authorization', admin())
        .send({ ...body, roles: ['GUEST'] })
        .expect(400);
    });
  });
});
