import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { AccessTokenPayload } from '../src/common/auth/jwt-auth.guard';
import { signParams } from '../src/modules/payments/vnpay';
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

const VNPAY_SECRET = 'vnpay-test-secret';
process.env.VNPAY_TMN_CODE = 'TESTCODE';
process.env.VNPAY_HASH_SECRET = VNPAY_SECRET;
process.env.VNPAY_URL = 'https://sandbox.example/pay';
process.env.VNPAY_RETURN_URL = 'http://localhost:5173/result';

const ID = {
  admin: '00000000-0000-4000-8000-000000000001',
  staff: '00000000-0000-4000-8000-000000000002',
  anUser: '00000000-0000-4000-8000-000000000005',
  binhUser: '00000000-0000-4000-8000-000000000006',
  trainerUser: '00000000-0000-4000-8000-000000000007',
  an: '10000000-0000-4000-8000-000000000005',
  binh: '10000000-0000-4000-8000-000000000006',
  gym: '30000000-0000-4000-8000-000000000001',
  stopped: '30000000-0000-4000-8000-000000000002',
};

describe('Đơn hàng, thanh toán, gói hội viên (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  const bearer = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;
  const an = () => bearer({ sub: ID.anUser, role: 'MEMBER', tv: 0 });
  const binh = () => bearer({ sub: ID.binhUser, role: 'MEMBER', tv: 0 });
  const staff = () => bearer({ sub: ID.staff, role: 'STAFF', tv: 0 });
  const admin = () => bearer({ sub: ID.admin, role: 'ADMIN', tv: 0 });
  const trainer = () => bearer({ sub: ID.trainerUser, role: 'TRAINER', tv: 0 });
  const http = () => request(app.getHttpServer());

  const createOrder = async (): Promise<string> => {
    const res = await http()
      .post('/api/v1/orders')
      .set('Authorization', an())
      .send({ packageId: ID.gym })
      .expect(201);
    return res.body.id as string;
  };
  const createPayment = async (orderId: string, method: 'CASH' | 'VNPAY') => {
    const res = await http()
      .post(`/api/v1/orders/${orderId}/payments`)
      .set('Authorization', an())
      .send({ method })
      .expect(201);
    return res.body as { id: string; merchantRef: string; amount: number; checkoutUrl: string | null };
  };
  const ipn = (merchantRef: string, overrides: Record<string, string> = {}) => {
    const params: Record<string, string> = {
      vnp_TxnRef: merchantRef,
      vnp_Amount: '50000000',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TransactionNo: `VNP${merchantRef}`,
      ...overrides,
    };
    return http()
      .get('/api/v1/payments/vnpay/ipn')
      .query({ ...params, vnp_SecureHash: signParams(params, VNPAY_SECRET) })
      .expect(200);
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    jwt = moduleRef.get(JwtService);
    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async () => {
    // TRUNCATE không chạy trigger chặn DELETE của audit_logs, nên xóa sạch được DB test
    await prisma.$executeRawUnsafe('TRUNCATE packages, audit_logs, users RESTART IDENTITY CASCADE');
    await prisma.user.createMany({
      data: [
        { id: ID.admin, phone: '0900000001', fullName: 'Admin', role: 'ADMIN' },
        { id: ID.staff, phone: '0900000002', fullName: 'Staff', role: 'STAFF' },
        { id: ID.anUser, phone: '0900000005', fullName: 'An', role: 'MEMBER' },
        { id: ID.binhUser, phone: '0900000006', fullName: 'Bình', role: 'MEMBER' },
        { id: ID.trainerUser, phone: '0900000007', fullName: 'PT', role: 'TRAINER' },
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
          id: ID.gym,
          name: 'Gym 1 tháng',
          type: 'GYM',
          price: 500000,
          durationValue: 1,
          durationUnit: 'MONTH',
        },
        {
          id: ID.stopped,
          name: 'Gói cũ',
          type: 'GYM',
          price: 100000,
          durationValue: 1,
          durationUnit: 'MONTH',
          status: 'INACTIVE',
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UC09 báo giá và tạo đơn', () => {
    it('báo giá không ghi gì vào DB', async () => {
      const res = await http()
        .post('/api/v1/orders/quote')
        .set('Authorization', an())
        .send({ packageId: ID.gym, startsOn: '2099-01-31' })
        .expect(200);
      expect(res.body).toMatchObject({ total: 500000, startsOn: '2099-01-31', endsOn: '2099-02-27' });
      expect(await prisma.order.count()).toBe(0);
    });

    it('tạo đơn chụp lại điều khoản; Admin sửa giá không đổi đơn cũ', async () => {
      const orderId = await createOrder();
      await prisma.package.update({ where: { id: ID.gym }, data: { price: 999000 } });
      const res = await http().get(`/api/v1/orders/${orderId}`).set('Authorization', an()).expect(200);
      expect(res.body).toMatchObject({
        status: 'PENDING',
        total: 500000,
        receipt: null,
        subscriptionId: null,
      });
      expect(res.body.terms.price).toBe(500000);
    });

    it('đã có đơn chờ cùng gói thì PENDING_ORDER_EXISTS kèm orderId', async () => {
      const orderId = await createOrder();
      const res = await http()
        .post('/api/v1/orders')
        .set('Authorization', an())
        .send({ packageId: ID.gym })
        .expect(409);
      expect(res.body.error).toMatchObject({ code: 'PENDING_ORDER_EXISTS', details: { orderId } });
    });

    it('gói ngừng bán hoặc ngày trong quá khứ thì VALIDATION_ERROR', async () => {
      await http()
        .post('/api/v1/orders')
        .set('Authorization', an())
        .send({ packageId: ID.stopped })
        .expect(400);
      await http()
        .post('/api/v1/orders')
        .set('Authorization', an())
        .send({ packageId: ID.gym, startsOn: '2000-01-01' })
        .expect(400);
    });

    it('Staff mua hộ phải gửi memberId; PT không được tạo đơn', async () => {
      await http()
        .post('/api/v1/orders')
        .set('Authorization', staff())
        .send({ packageId: ID.gym })
        .expect(400);
      await http()
        .post('/api/v1/orders')
        .set('Authorization', staff())
        .send({ packageId: ID.gym, memberId: ID.an })
        .expect(201);
      await http()
        .post('/api/v1/orders')
        .set('Authorization', trainer())
        .send({ packageId: ID.gym })
        .expect(403);
    });

    it('xem đơn của người khác thì 404', async () => {
      const orderId = await createOrder();
      await http().get(`/api/v1/orders/${orderId}`).set('Authorization', binh()).expect(404);
    });
  });

  describe('Hủy đơn', () => {
    it('hội viên hủy được; hủy lặp vẫn 200; payment chờ chuyển FAILED', async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'CASH');
      const res = await http()
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', an())
        .send({})
        .expect(200);
      expect(res.body.status).toBe('CANCELLED');
      await http().post(`/api/v1/orders/${orderId}/cancel`).set('Authorization', an()).send({}).expect(200);
      expect((await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe('FAILED');
    });

    it('Staff hủy hộ phải có lý do và ghi audit', async () => {
      const orderId = await createOrder();
      await http()
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', staff())
        .send({})
        .expect(400);
      await http()
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', staff())
        .send({ reason: 'Khách đổi ý' })
        .expect(200);
      expect(await prisma.auditLog.count({ where: { action: 'ORDER_CANCEL' } })).toBe(1);
    });

    it('đơn đã PAID thì ORDER_NOT_PENDING', async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'CASH');
      await http()
        .post(`/api/v1/payments/${payment.id}/confirm-cash`)
        .set('Authorization', staff())
        .send({ receivedAmount: 500000 })
        .expect(200);
      const res = await http()
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', an())
        .send({})
        .expect(409);
      expect(res.body.error).toMatchObject({ code: 'ORDER_NOT_PENDING', details: { status: 'PAID' } });
    });
  });

  describe('UC13 tiền mặt', () => {
    it('xác nhận tạo cùng lúc đơn PAID, biên lai, gói ACTIVE, thông báo, audit', async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'CASH');
      const res = await http()
        .post(`/api/v1/payments/${payment.id}/confirm-cash`)
        .set('Authorization', staff())
        .send({ receivedAmount: 500000 })
        .expect(200);
      expect(res.body).toMatchObject({ status: 'SUCCESS', confirmedBy: { id: ID.staff } });

      const order = await http().get(`/api/v1/orders/${orderId}`).set('Authorization', an()).expect(200);
      expect(order.body.status).toBe('PAID');
      expect(order.body.receiptNo).toMatch(/^BL-\d{8}-0001$/);
      expect(order.body.receipt).toMatchObject({
        amount: 500000,
        method: 'CASH',
        collectedBy: { id: ID.staff },
      });
      expect(order.body.subscriptionId).toEqual(expect.any(String));
      expect(await prisma.notification.count({ where: { userId: ID.anUser, type: 'PAYMENT_SUCCESS' } })).toBe(
        1,
      );
      expect(await prisma.auditLog.count({ where: { action: 'CASH_CONFIRM' } })).toBe(1);
    });

    it('gửi lặp và gửi song song chỉ tạo một gói', async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'CASH');
      const send = () =>
        http()
          .post(`/api/v1/payments/${payment.id}/confirm-cash`)
          .set('Authorization', staff())
          .send({ receivedAmount: 500000 });
      const results = await Promise.all([send(), send()]);
      expect(results.map((r) => r.status)).toEqual([200, 200]);
      await send().expect(200);
      expect(await prisma.subscription.count({ where: { orderId } })).toBe(1);
    });

    it('sai số tiền thì CASH_AMOUNT_MISMATCH và không tạo gói', async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'CASH');
      const res = await http()
        .post(`/api/v1/payments/${payment.id}/confirm-cash`)
        .set('Authorization', staff())
        .send({ receivedAmount: 400000 })
        .expect(422);
      expect(res.body.error).toMatchObject({
        code: 'CASH_AMOUNT_MISMATCH',
        details: { expectedAmount: 500000 },
      });
      expect(await prisma.subscription.count()).toBe(0);
    });

    it('hội viên không tự xác nhận được', async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'CASH');
      await http()
        .post(`/api/v1/payments/${payment.id}/confirm-cash`)
        .set('Authorization', an())
        .send({ receivedAmount: 500000 })
        .expect(403);
    });

    it('xác nhận payment VNPay thì VALIDATION_ERROR', async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'VNPAY');
      await http()
        .post(`/api/v1/payments/${payment.id}/confirm-cash`)
        .set('Authorization', staff())
        .send({ receivedAmount: 500000 })
        .expect(400);
    });
  });

  describe('UC12 VNPay', () => {
    it('tạo payment trả checkoutUrl; bấm lại thì payment cũ FAILED', async () => {
      const orderId = await createOrder();
      const first = await createPayment(orderId, 'VNPAY');
      expect(first.checkoutUrl).toContain('vnp_SecureHash=');
      const second = await createPayment(orderId, 'VNPAY');
      expect((await prisma.payment.findUniqueOrThrow({ where: { id: first.id } })).status).toBe('FAILED');
      expect(second.id).not.toBe(first.id);
    });

    it('IPN thành công kích hoạt gói; gọi lặp trả 02, không tạo gói lần hai', async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'VNPAY');
      expect((await ipn(payment.merchantRef)).body.RspCode).toBe('00');
      expect((await ipn(payment.merchantRef)).body.RspCode).toBe('02');
      expect(await prisma.subscription.count({ where: { orderId } })).toBe(1);
      const saved = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
      expect(saved.gatewayTxnId).toBe(`VNP${payment.merchantRef}`);
      expect(saved.gatewayPayload).not.toBeNull();
    });

    it('sai chữ ký trả 97, không đổi gì', async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'VNPAY');
      const res = await http()
        .get('/api/v1/payments/vnpay/ipn')
        .query({ vnp_TxnRef: payment.merchantRef, vnp_Amount: '50000000', vnp_SecureHash: 'sai' })
        .expect(200);
      expect(res.body.RspCode).toBe('97');
      expect(await prisma.subscription.count()).toBe(0);
    });

    it('không tìm thấy trả 01; sai số tiền trả 04', async () => {
      expect((await ipn('KHONGCO')).body.RspCode).toBe('01');
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'VNPAY');
      expect((await ipn(payment.merchantRef, { vnp_Amount: '100' })).body.RspCode).toBe('04');
    });

    it('thất bại thì payment FAILED, đơn vẫn PENDING, có thông báo', async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'VNPAY');
      const res = await ipn(payment.merchantRef, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' });
      expect(res.body.RspCode).toBe('00');
      expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe('PENDING');
      expect(await prisma.notification.count({ where: { type: 'PAYMENT_FAILED' } })).toBe(1);
    });

    it('Q17d: link cũ báo thành công khi đơn còn PENDING thì ghi nhận', async () => {
      const orderId = await createOrder();
      const old = await createPayment(orderId, 'VNPAY');
      const latest = await createPayment(orderId, 'VNPAY');
      expect((await ipn(old.merchantRef)).body.RspCode).toBe('00');
      expect((await prisma.payment.findUniqueOrThrow({ where: { id: latest.id } })).status).toBe('FAILED');
      expect(await prisma.subscription.count({ where: { orderId } })).toBe(1);
    });

    it('Q17d: đơn không còn PENDING thì chỉ lưu dữ liệu, không kích hoạt', async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'VNPAY');
      await http().post(`/api/v1/orders/${orderId}/cancel`).set('Authorization', an()).send({}).expect(200);
      expect((await ipn(payment.merchantRef)).body.RspCode).toBe('02');
      expect(await prisma.subscription.count()).toBe(0);
      const saved = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
      expect(saved.gatewayPayload).not.toBeNull();
    });

    it('tạo thanh toán cho đơn không còn PENDING thì ORDER_NOT_PENDING', async () => {
      const orderId = await createOrder();
      await http().post(`/api/v1/orders/${orderId}/cancel`).set('Authorization', an()).send({}).expect(200);
      const res = await http()
        .post(`/api/v1/orders/${orderId}/payments`)
        .set('Authorization', an())
        .send({ method: 'CASH' })
        .expect(409);
      expect(res.body.error.code).toBe('ORDER_NOT_PENDING');
    });
  });

  describe('UC14 lịch sử và UC10 gói của tôi', () => {
    const buy = async () => {
      const orderId = await createOrder();
      const payment = await createPayment(orderId, 'CASH');
      await http()
        .post(`/api/v1/payments/${payment.id}/confirm-cash`)
        .set('Authorization', staff())
        .send({ receivedAmount: 500000 })
        .expect(200);
      return orderId;
    };

    it('hội viên chỉ thấy đơn và giao dịch của mình', async () => {
      await buy();
      const orders = await http()
        .get('/api/v1/orders')
        .query({ memberId: ID.binh })
        .set('Authorization', an())
        .expect(200);
      expect(orders.body.meta.total).toBe(1);
      const other = await http().get('/api/v1/payments').set('Authorization', binh()).expect(200);
      expect(other.body.meta.total).toBe(0);
    });

    it('Staff chỉ xem trong ngày dù gửi khoảng ngày khác; Admin xem được', async () => {
      await buy();
      const old = new Date('2020-01-15T03:00:00Z');
      await prisma.payment.updateMany({ data: { createdAt: old } });
      await prisma.order.updateMany({ data: { createdAt: old } });
      const query = { from: '2020-01-01', to: '2020-12-31' };
      const asStaff = await http()
        .get('/api/v1/payments')
        .query(query)
        .set('Authorization', staff())
        .expect(200);
      expect(asStaff.body.meta.total).toBe(0);
      const asAdmin = await http()
        .get('/api/v1/payments')
        .query(query)
        .set('Authorization', admin())
        .expect(200);
      expect(asAdmin.body.meta.total).toBe(1);
    });

    it('gói của tôi có daysLeft; gói GYM không có số buổi; người khác 404', async () => {
      await buy();
      const list = await http()
        .get('/api/v1/subscriptions')
        .query({ status: 'ACTIVE' })
        .set('Authorization', an())
        .expect(200);
      expect(list.body.data[0]).toMatchObject({
        packageName: 'Gym 1 tháng',
        status: 'ACTIVE',
        sessions: null,
        type: 'GYM',
      });
      expect(list.body.data[0].daysLeft).toBeGreaterThan(0);

      const id = list.body.data[0].id as string;
      const detail = await http().get(`/api/v1/subscriptions/${id}`).set('Authorization', an()).expect(200);
      expect(detail.body.monthlySessions).toEqual([]);
      await http().get(`/api/v1/subscriptions/${id}`).set('Authorization', binh()).expect(404);
    });

    it('sau khi có gói ACTIVE thì GET /me báo là hội viên', async () => {
      await buy();
      const me = await http().get('/api/v1/me').set('Authorization', an()).expect(200);
      expect(me.body.member.hasActiveSubscription).toBe(true);
    });
  });
});
