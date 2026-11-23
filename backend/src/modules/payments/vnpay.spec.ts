import { buildCheckoutUrl, isValidSignature, signParams, toVnpayDate } from './vnpay';

const SECRET = 'test-secret';
const config = {
  tmnCode: 'TESTCODE',
  hashSecret: SECRET,
  url: 'https://sandbox.example/pay',
  returnUrl: 'http://localhost:5173/orders/result',
};

describe('VNPay', () => {
  it('đổi giờ sang yyyyMMddHHmmss theo giờ Việt Nam', () => {
    expect(toVnpayDate(new Date('2026-11-05T02:03:04Z'))).toBe('20261105090304');
  });

  it('URL thanh toán có số tiền × 100 và chữ ký kiểm lại được', () => {
    const url = new URL(
      buildCheckoutUrl(config, {
        merchantRef: 'GYM1',
        amount: 500000,
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-11-05T02:00:00Z'),
        expiresAt: new Date('2026-11-05T02:30:00Z'),
        orderInfo: 'Thanh toan don hang',
      }),
    );
    const params = Object.fromEntries(url.searchParams);
    expect(params.vnp_Amount).toBe('50000000');
    expect(params.vnp_TxnRef).toBe('GYM1');
    expect(isValidSignature(params, SECRET)).toBe(true);
  });

  it('sửa số tiền hoặc sai khóa thì chữ ký không hợp lệ', () => {
    const params: Record<string, string> = { vnp_Amount: '50000000', vnp_TxnRef: 'GYM1' };
    const signed = { ...params, vnp_SecureHash: signParams(params, SECRET) };
    expect(isValidSignature(signed, SECRET)).toBe(true);
    expect(isValidSignature({ ...signed, vnp_Amount: '100' }, SECRET)).toBe(false);
    expect(isValidSignature(signed, 'khoa-khac')).toBe(false);
  });

  it('thiếu chữ ký thì không hợp lệ', () => {
    expect(isValidSignature({ vnp_TxnRef: 'GYM1' }, SECRET)).toBe(false);
  });
});
