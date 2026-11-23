import { createHmac, timingSafeEqual } from 'crypto';

export type VnpayConfig = { tmnCode: string; hashSecret: string; url: string; returnUrl: string };

export type VnpayCheckout = {
  merchantRef: string;
  amount: number;
  ipAddress: string;
  createdAt: Date;
  expiresAt: Date;
  orderInfo: string;
};

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const SIGNATURE_FIELDS = new Set(['vnp_SecureHash', 'vnp_SecureHashType']);

/** VNPay nhận ngày dạng yyyyMMddHHmmss theo giờ Việt Nam. */
export const toVnpayDate = (date: Date): string =>
  new Date(date.getTime() + VN_OFFSET_MS).toISOString().replace(/[-:T]/g, '').slice(0, 14);

/** Chuỗi ký theo tài liệu VNPay: sắp xếp tên tham số, mã hóa giá trị, khoảng trắng thành `+`. */
const toSignedQuery = (params: Record<string, string>): string =>
  Object.keys(params)
    .filter((key) => !SIGNATURE_FIELDS.has(key) && params[key] !== '')
    .sort()
    .map((key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`)
    .join('&');

const sign = (query: string, secret: string): string =>
  createHmac('sha512', secret).update(query, 'utf8').digest('hex');

export const buildCheckoutUrl = (config: VnpayConfig, checkout: VnpayCheckout): string => {
  const query = toSignedQuery({
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: String(checkout.amount * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: checkout.merchantRef,
    vnp_OrderInfo: checkout.orderInfo,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: checkout.ipAddress,
    vnp_CreateDate: toVnpayDate(checkout.createdAt),
    vnp_ExpireDate: toVnpayDate(checkout.expiresAt),
  });
  return `${config.url}?${query}&vnp_SecureHash=${sign(query, config.hashSecret)}`;
};

/** Kiểm chữ ký `vnp_SecureHash` trước mọi xử lý IPN. */
export const isValidSignature = (params: Record<string, string>, hashSecret: string): boolean => {
  const received = Buffer.from((params.vnp_SecureHash ?? '').toLowerCase());
  const expected = Buffer.from(sign(toSignedQuery(params), hashSecret));
  return received.length === expected.length && timingSafeEqual(received, expected);
};

/** Tạo chữ ký cho một bộ tham số; dùng để test IPN khi chạy local, vì VNPay không gọi được về máy. */
export const signParams = (params: Record<string, string>, hashSecret: string): string =>
  sign(toSignedQuery(params), hashSecret);
