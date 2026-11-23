/**
 * Seed dữ liệu demo, chạy SAU `npm run seed` (cần tài khoản và gói mẫu của seed.ts).
 * Chạy: `npm run seed:demo`. Idempotent: id, mã đơn, biên lai, dedup_key cố định nên chạy lại không sinh trùng.
 *
 * Tạo cho buổi demo:
 * - Hội viên 0910000001: gói Gym + gói PT 12 buổi đang hiệu lực (đơn PAID tiền mặt), 3 lịch PT với PT 0900000021
 *   (1 đã tập, 1 đã chốt sắp tới, 1 đang chờ PT trả lời), 1 lượt check-in đã ra, thông báo.
 * - Hội viên 0910000002: gói Gym đang hiệu lực, đang trong phòng (lượt chưa check-out).
 * - Hội viên 0910000003: gói Gym còn 5 ngày (để thấy cảnh báo sắp hết hạn khi check-in).
 * - PT 0900000021: khung giờ rảnh 18:00–21:00 các ngày trong tuần, 4 tuần tới.
 */
import { PrismaClient, type Package } from '@prisma/client';

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const todayVn = (): string => new Date(Date.now() + VN_OFFSET_MS).toISOString().slice(0, 10);
const addDays = (day: string, n: number): string =>
  new Date(new Date(`${day}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
const dateOnly = (day: string): Date => new Date(`${day}T00:00:00.000Z`);
/** Giờ VN của một ngày, ví dụ at('2026-11-10', 18) = 18:00 ngày 10/11 giờ VN. */
const at = (day: string, hour: number, minute = 0): Date =>
  new Date(`${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`);

/** Id cố định cho bản ghi demo: 'de000000-0000-4000-8000-0000000000NN'. */
const demoId = (n: number): string => `de000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const need = <T>(value: T | null, what: string): T => {
  if (!value) throw new Error(`Thiếu ${what}. Chạy \`npm run seed\` trước.`);
  return value;
};

async function memberByPhone(phone: string) {
  const user = need(
    await prisma.user.findUnique({ where: { phone }, include: { member: true } }),
    `hội viên ${phone}`,
  );
  return { user, member: need(user.member, `hồ sơ hội viên ${phone}`) };
}

/** Một đơn PAID tiền mặt + payment SUCCESS + gói hội viên ACTIVE, như sau khi quầy xác nhận tiền mặt. */
async function paidSubscription(opts: {
  n: number;
  memberId: string;
  pkg: Package;
  startsOn: string;
  endsOn: string;
  staffId: string;
}) {
  const { n, memberId, pkg, startsOn, endsOn, staffId } = opts;
  const paidAt = at(startsOn, 9);
  const receiptNo = `BL-DEMO-${String(n).padStart(4, '0')}`;
  const order = await prisma.order.upsert({
    where: { receiptNo },
    update: {},
    create: {
      id: demoId(100 + n),
      memberId,
      packageId: pkg.id,
      priceSnapshot: pkg.price,
      durationValueSnapshot: pkg.durationValue,
      durationUnitSnapshot: pkg.durationUnit,
      totalSessionsSnapshot: pkg.totalSessions,
      sessionMinutesSnapshot: pkg.sessionMinutes,
      includesClassSnapshot: pkg.includesClass,
      startsOn: dateOnly(startsOn),
      total: pkg.price,
      status: 'PAID',
      expiresAt: at(startsOn, 23, 59),
      receiptNo,
      paidAt,
      createdBy: staffId,
    },
  });
  await prisma.payment.upsert({
    where: { merchantRef: `GYMDEMO${String(n).padStart(4, '0')}` },
    update: {},
    create: {
      orderId: order.id,
      method: 'CASH',
      amount: pkg.price,
      status: 'SUCCESS',
      merchantRef: `GYMDEMO${String(n).padStart(4, '0')}`,
      confirmedBy: staffId,
      paidAt,
    },
  });
  return prisma.subscription.upsert({
    where: { orderId: order.id },
    update: { endsOn: dateOnly(endsOn), status: 'ACTIVE' },
    create: {
      memberId,
      packageId: pkg.id,
      orderId: order.id,
      packageName: pkg.name,
      totalSessions: pkg.totalSessions,
      sessionMinutes: pkg.sessionMinutes,
      includesClass: pkg.includesClass,
      startsOn: dateOnly(startsOn),
      endsOn: dateOnly(endsOn),
    },
  });
}

async function main() {
  const today = todayVn();
  const staff = need(await prisma.user.findUnique({ where: { phone: '0900000011' } }), 'Staff 0900000011');
  const trainerUser = need(
    await prisma.user.findUnique({ where: { phone: '0900000021' }, include: { trainer: true } }),
    'PT 0900000021',
  );
  const trainer = need(trainerUser.trainer, 'hồ sơ PT 0900000021');
  const gym = need(await prisma.package.findFirst({ where: { name: 'Gym 1 tháng' } }), 'gói Gym 1 tháng');
  const pt = need(await prisma.package.findFirst({ where: { name: 'PT 12 buổi' } }), 'gói PT 12 buổi');
  const an = await memberByPhone('0910000001');
  const binh = await memberByPhone('0910000002');
  const chi = await memberByPhone('0910000003');

  // ---------- Gói hội viên ----------
  await paidSubscription({
    n: 1,
    memberId: an.member.id,
    pkg: gym,
    startsOn: addDays(today, -10),
    endsOn: addDays(today, 19),
    staffId: staff.id,
  });
  const anPt = await paidSubscription({
    n: 2,
    memberId: an.member.id,
    pkg: pt,
    startsOn: addDays(today, -14),
    endsOn: addDays(today, 45),
    staffId: staff.id,
  });
  await paidSubscription({
    n: 3,
    memberId: binh.member.id,
    pkg: gym,
    startsOn: addDays(today, -5),
    endsOn: addDays(today, 24),
    staffId: staff.id,
  });
  await paidSubscription({
    n: 4,
    memberId: chi.member.id,
    pkg: gym,
    startsOn: addDays(today, -25),
    endsOn: addDays(today, 4),
    staffId: staff.id,
  });

  // ---------- Lịch PT của hội viên An với PT ----------
  const appointments = [
    { n: 1, day: addDays(today, -3), status: 'COMPLETED' as const, awaiting: null },
    { n: 2, day: addDays(today, 2), status: 'CONFIRMED' as const, awaiting: null },
    { n: 3, day: addDays(today, 4), status: 'PENDING' as const, awaiting: 'TRAINER' as const },
  ];
  for (const a of appointments) {
    const startsAt = at(a.day, 18);
    const endsAt = at(a.day, 19);
    await prisma.appointment.upsert({
      where: { id: demoId(200 + a.n) },
      update: {},
      create: {
        id: demoId(200 + a.n),
        subscriptionId: anPt.id,
        memberId: an.member.id,
        trainerId: trainer.id,
        status: a.status,
        awaitingRole: a.awaiting,
        version: a.status === 'PENDING' ? 1 : 2,
        startsAt,
        endsAt,
        completedBy: a.status === 'COMPLETED' ? trainerUser.id : null,
        completedAt: a.status === 'COMPLETED' ? endsAt : null,
      },
    });
    await prisma.appointmentProposal.upsert({
      where: { id: demoId(300 + a.n) },
      update: {},
      create: {
        id: demoId(300 + a.n),
        appointmentId: demoId(200 + a.n),
        kind: 'INITIAL',
        proposedBy: an.user.id,
        proposedRole: 'MEMBER',
        startsAt,
        endsAt,
        status: a.status === 'PENDING' ? 'OPEN' : 'ACCEPTED',
        createdAt: at(addDays(a.day, -2), 10),
      },
    });
  }

  // ---------- Khung giờ rảnh của PT: 18:00–21:00 thứ Hai đến thứ Bảy, 4 tuần ----------
  await prisma.trainerAvailability.deleteMany({
    where: { trainerId: trainer.id, startsAt: { gte: at(today, 0), lt: at(addDays(today, 28), 0) } },
  });
  const slots = Array.from({ length: 28 }, (_, i) => addDays(today, i))
    .filter((day) => new Date(`${day}T00:00:00Z`).getUTCDay() !== 0)
    .map((day) => ({ trainerId: trainer.id, startsAt: at(day, 18), endsAt: at(day, 21) }));
  await prisma.trainerAvailability.createMany({ data: slots });

  // ---------- Check-in ----------
  await prisma.checkIn.upsert({
    where: { id: demoId(401) },
    update: {},
    create: {
      id: demoId(401),
      memberId: an.member.id,
      subscriptionId: anPt.id,
      method: 'QR',
      checkedInAt: at(addDays(today, -1), 7),
      checkedOutAt: at(addDays(today, -1), 8, 30),
      checkoutType: 'SELF',
      checkedInBy: staff.id,
    },
  });
  const binhSub = need(
    await prisma.subscription.findFirst({ where: { memberId: binh.member.id, status: 'ACTIVE' } }),
    'gói của Bình',
  );
  const binhOpen = await prisma.checkIn.findFirst({
    where: { memberId: binh.member.id, checkedOutAt: null },
  });
  if (!binhOpen) {
    await prisma.checkIn.create({
      data: {
        id: demoId(402),
        memberId: binh.member.id,
        subscriptionId: binhSub.id,
        method: 'PHONE',
        checkedInBy: staff.id,
      },
    });
  }

  // ---------- Thông báo ----------
  const notifications = [
    {
      key: 'demo-an-payment',
      userId: an.user.id,
      type: 'PAYMENT_SUCCESS',
      title: 'Thanh toán thành công',
      body: 'Gói PT 12 buổi đã được kích hoạt.',
      targetType: 'ORDER',
      targetId: demoId(102),
    },
    {
      key: 'demo-an-confirmed',
      userId: an.user.id,
      type: 'APPOINTMENT_CONFIRMED',
      title: 'Lịch tập đã được xác nhận',
      body: 'Buổi tập lúc 18:00 đã được xác nhận.',
      targetType: 'APPOINTMENT',
      targetId: demoId(202),
    },
    {
      key: 'demo-trainer-proposed',
      userId: trainerUser.id,
      type: 'APPOINTMENT_PROPOSED',
      title: 'Có đề xuất lịch tập mới',
      body: 'Hội viên đề xuất buổi tập lúc 18:00.',
      targetType: 'APPOINTMENT',
      targetId: demoId(203),
    },
  ];
  for (const { key, ...data } of notifications) {
    await prisma.notification.upsert({
      where: { dedupKey: key },
      update: {},
      create: { ...data, dedupKey: key },
    });
  }

  process.stdout.write(
    'Seed demo xong: hội viên 0910000001 (Gym + PT, 3 lịch PT), 0910000002 (đang trong phòng), ' +
      '0910000003 (gói sắp hết hạn); PT 0900000021 có khung giờ 4 tuần.\n',
  );
}

main()
  .catch((e: unknown) => {
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
