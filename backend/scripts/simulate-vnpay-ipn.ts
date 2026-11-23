/*
 * Gửi IPN VNPay có chữ ký đúng tới backend đang chạy local, khi VNPay không gọi được về máy (không mở ngrok).
 * Chỉ dùng cho máy dev: ký bằng VNPAY_HASH_SECRET trong .env, giống hệt cách VNPay ký.
 *
 *   cd backend
 *   node --env-file=.env -r ts-node/register scripts/simulate-vnpay-ipn.ts <merchantRef> [fail]
 *
 * merchantRef lấy từ response tạo thanh toán hoặc GET /payments. Thêm `fail` để giả lập khách hủy thanh toán.
 */
import { PrismaClient } from '@prisma/client';
import { signParams } from '../src/modules/payments/vnpay';

const main = async () => {
  const [merchantRef, mode] = process.argv.slice(2);
  const secret = process.env.VNPAY_HASH_SECRET;
  if (!merchantRef || !secret) {
    throw new Error('Cần merchantRef và VNPAY_HASH_SECRET trong .env');
  }

  const prisma = new PrismaClient();
  const payment = await prisma.payment.findUnique({ where: { merchantRef } });
  await prisma.$disconnect();
  if (!payment) throw new Error(`Không có payment ${merchantRef}`);

  const failed = mode === 'fail';
  const params: Record<string, string> = {
    vnp_TxnRef: merchantRef,
    vnp_Amount: String(payment.amount * 100),
    vnp_ResponseCode: failed ? '24' : '00',
    vnp_TransactionStatus: failed ? '02' : '00',
    vnp_TransactionNo: `LOCAL${Date.now()}`,
  };
  const query = new URLSearchParams({ ...params, vnp_SecureHash: signParams(params, secret) });
  const base = process.env.IPN_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/v1/payments/vnpay/ipn?${query.toString()}`);
  process.stdout.write(`${JSON.stringify(await res.json())}\n`);
};

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
