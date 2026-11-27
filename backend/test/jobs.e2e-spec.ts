import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { JobsService } from '../src/modules/jobs/jobs.service';
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
  ptUser: '00000000-0000-4000-8000-000000000003',
  anUser: '00000000-0000-4000-8000-000000000005',
  an: '10000000-0000-4000-8000-000000000005',
  pt: '20000000-0000-4000-8000-000000000003',
  gym: '30000000-0000-4000-8000-000000000001',
  ptPkg: '30000000-0000-4000-8000-000000000002',
};

/** Mốc cố định 28/11/2026 10:00 giờ VN để kết quả không phụ thuộc ngày chạy test. */
const NOW = new Date('2026-11-28T10:00:00+07:00');
const TODAY = '2026-11-28';

describe('Việc nền, quyết định 17 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jobs: JobsService;
  let n = 0;

  const order = async (packageId: string, over: { status?: 'PENDING' | 'PAID'; expiresAt?: Date } = {}) => {
    n += 1;
    return prisma.order.create({
      data: {
        memberId: ID.an,
        packageId,
        priceSnapshot: 1,
        durationValueSnapshot: 1,
        durationUnitSnapshot: 'MONTH',
        totalSessionsSnapshot: packageId === ID.ptPkg ? 10 : null,
        sessionMinutesSnapshot: packageId === ID.ptPkg ? 60 : null,
        includesClassSnapshot: false,
        startsOn: new Date('2026-11-01'),
        total: 1,
        status: over.status ?? 'PAID',
        expiresAt: over.expiresAt ?? new Date(),
        createdBy: ID.admin,
        receiptNo: over.status === 'PENDING' ? null : `BL-TEST-${n}`,
      },
    });
  };
  const sub = async (endsOn: string, packageId = ID.gym) => {
    const o = await order(packageId);
    return prisma.subscription.create({
      data: {
        memberId: ID.an,
        packageId,
        orderId: o.id,
        packageName: packageId === ID.ptPkg ? 'PT 10 buổi' : 'Gym 1 tháng',
        totalSessions: packageId === ID.ptPkg ? 10 : null,
        sessionMinutes: packageId === ID.ptPkg ? 60 : null,
        includesClass: false,
        startsOn: new Date('2026-11-01'),
        endsOn: new Date(endsOn),
      },
    });
  };
  const appt = async (
    subscriptionId: string,
    startsAt: string,
    status: 'CONFIRMED' | 'PENDING' = 'CONFIRMED',
  ) => {
    const start = new Date(startsAt);
    return prisma.appointment.create({
      data: {
        memberId: ID.an,
        subscriptionId,
        trainerId: ID.pt,
        status,
        startsAt: start,
        endsAt: new Date(start.getTime() + 3600_000),
      },
    });
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    prisma = moduleRef.get(PrismaService);
    jobs = moduleRef.get(JobsService);

    await prisma.$executeRawUnsafe('TRUNCATE packages, audit_logs, users RESTART IDENTITY CASCADE');
    await prisma.user.createMany({
      data: [
        { id: ID.admin, phone: '0900000001', fullName: 'Quản trị', role: 'ADMIN' },
        { id: ID.ptUser, phone: '0900000021', fullName: 'Lê Minh Cường', role: 'TRAINER' },
        { id: ID.anUser, phone: '0901234567', fullName: 'Nguyễn Văn An', role: 'MEMBER' },
      ],
    });
    await prisma.member.create({
      data: { id: ID.an, userId: ID.anUser, memberCode: 'HV000001', qrToken: 'qr-an' },
    });
    await prisma.trainer.create({ data: { id: ID.pt, userId: ID.ptUser } });
    await prisma.package.createMany({
      data: [
        {
          id: ID.gym,
          name: 'Gym 1 tháng',
          type: 'GYM',
          price: 300000,
          durationValue: 1,
          durationUnit: 'MONTH',
        },
        {
          id: ID.ptPkg,
          name: 'PT 10 buổi',
          type: 'PT',
          price: 3000000,
          durationValue: 1,
          durationUnit: 'MONTH',
          totalSessions: 10,
          sessionMinutes: 60,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('gói qua ngày kết thúc chuyển EXPIRED; gói hết hạn hôm nay vẫn ACTIVE', async () => {
    const past = await sub('2026-11-27');
    const lastDay = await sub(TODAY);
    expect(await jobs.expireSubscriptions(TODAY)).toBe(1);
    expect((await prisma.subscription.findUniqueOrThrow({ where: { id: past.id } })).status).toBe('EXPIRED');
    expect((await prisma.subscription.findUniqueOrThrow({ where: { id: lastDay.id } })).status).toBe(
      'ACTIVE',
    );
  });

  it('08:00: báo gói hết hạn trong 7 ngày tới, chạy lại không gửi lặp', async () => {
    const inWindow = await sub('2026-12-04');
    await sub('2026-12-05'); // ngoài 7 ngày (28/11–04/12)
    const first = await jobs.notifyExpiringSubscriptions(TODAY);
    // Gồm gói hết hạn hôm nay ở ca trước và gói 04/12
    expect(first).toBe(2);
    expect(await jobs.notifyExpiringSubscriptions(TODAY)).toBe(0);
    const note = await prisma.notification.findFirstOrThrow({ where: { targetId: inWindow.id } });
    expect(note).toMatchObject({
      userId: ID.anUser,
      type: 'SUBSCRIPTION_EXPIRING',
      targetType: 'SUBSCRIPTION',
    });
    expect(note.body).toContain('04/12/2026');
  });

  it('nhắc lịch PT đã chốt trước 2 giờ cho cả hội viên và PT, một lần; lịch PENDING hoặc xa hơn 2 giờ không nhắc', async () => {
    const s = await sub('2026-12-20', ID.ptPkg);
    const soon = await appt(s.id, '2026-11-28T11:30:00+07:00');
    await appt(s.id, '2026-11-28T13:00:00+07:00'); // còn 3 giờ
    await appt(s.id, '2026-11-28T11:00:00+07:00', 'PENDING');
    expect(await jobs.remindUpcomingAppointments(NOW)).toBe(2);
    expect(await jobs.remindUpcomingAppointments(NOW)).toBe(0);
    const notes = await prisma.notification.findMany({
      where: { type: 'APPOINTMENT_REMINDER', targetId: soon.id },
    });
    expect(notes.map((x) => x.userId).sort()).toEqual([ID.ptUser, ID.anUser].sort());
    expect(notes.find((x) => x.userId === ID.anUser)?.body).toContain('11:30 28/11');
  });

  it('buổi đã kết thúc quá 24 giờ vẫn CONFIRMED: nhắc PT xác nhận, một lần', async () => {
    const s = await sub('2026-12-21', ID.ptPkg);
    const old = await appt(s.id, '2026-11-26T08:00:00+07:00'); // kết thúc 09:00 26/11
    await appt(s.id, '2026-11-27T12:00:00+07:00'); // kết thúc 13:00 27/11, chưa đủ 24 giờ
    expect(await jobs.remindTrainerConfirm(NOW)).toBe(1);
    expect(await jobs.remindTrainerConfirm(NOW)).toBe(0);
    const note = await prisma.notification.findFirstOrThrow({
      where: { type: 'APPOINTMENT_CONFIRM_REMINDER' },
    });
    expect(note).toMatchObject({ userId: ID.ptUser, targetId: old.id });
  });

  it('đơn PENDING quá hạn chuyển EXPIRED, thanh toán đang chờ chuyển FAILED; đơn còn hạn giữ nguyên', async () => {
    const overdue = await order(ID.gym, { status: 'PENDING', expiresAt: new Date(NOW.getTime() - 60_000) });
    const fresh = await order(ID.ptPkg, { status: 'PENDING', expiresAt: new Date(NOW.getTime() + 600_000) });
    await prisma.payment.create({
      data: { orderId: overdue.id, method: 'VNPAY', amount: 1, merchantRef: 'REF-OLD' },
    });
    expect(await jobs.expirePendingOrders(NOW)).toBe(1);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: overdue.id } })).status).toBe('EXPIRED');
    expect((await prisma.order.findUniqueOrThrow({ where: { id: fresh.id } })).status).toBe('PENDING');
    expect((await prisma.payment.findUniqueOrThrow({ where: { merchantRef: 'REF-OLD' } })).status).toBe(
      'FAILED',
    );
  });
});
