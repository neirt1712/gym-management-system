/**
 * Seed dữ liệu dev: 1 admin, 2 staff, 3 PT, 30 hội viên, 5 gói (be-plan tuần 2).
 * Chủ file: Hồng Anh. Chạy: `npm run seed` (cần DATABASE_URL và SEED_DEFAULT_PASSWORD trong backend/.env).
 *
 * Idempotent: chạy lại nhiều lần không sinh bản ghi trùng (khóa theo số điện thoại, tên gói).
 * Mọi tài khoản dùng chung mật khẩu SEED_DEFAULT_PASSWORD. Chỉ dùng ở máy dev và staging.
 * Giá, thời hạn của gói là SỐ DEMO, không phải bảng giá thật của phòng tập.
 */
import { PrismaClient, Prisma, Role } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** ADR 0001 + business.config.ts (auth.bcryptCost). Phải khớp với cách Auth của Triển băm mật khẩu. */
const BCRYPT_COST = 10;

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô'];
const DEM = ['Văn', 'Thị', 'Minh', 'Thu', 'Đức', 'Ngọc', 'Quang', 'Hải'];
const TEN = [
  'An',
  'Bình',
  'Chi',
  'Dũng',
  'Giang',
  'Hà',
  'Khánh',
  'Linh',
  'Nam',
  'Phương',
  'Quân',
  'Trang',
  'Tuấn',
  'Vy',
  'Yến',
];

function memberName(i: number): string {
  return `${HO[i % HO.length]} ${DEM[i % DEM.length]} ${TEN[i % TEN.length]}`;
}

async function upsertUser(data: {
  phone: string;
  fullName: string;
  role: Role;
  email?: string;
  shift?: string;
  passwordHash: string;
}) {
  return prisma.user.upsert({
    where: { phone: data.phone },
    // Không ghi đè gì khi đã có: seed chạy lại không làm hỏng dữ liệu đang thử
    update: {},
    create: {
      phone: data.phone,
      fullName: data.fullName,
      role: data.role,
      email: data.email,
      shift: data.shift,
      passwordHash: data.passwordHash,
    },
  });
}

async function main(): Promise<void> {
  const password = process.env.SEED_DEFAULT_PASSWORD;
  if (!password) {
    throw new Error('Thiếu SEED_DEFAULT_PASSWORD trong backend/.env');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  // ---------- Nhân sự ----------
  await upsertUser({
    phone: '0900000001',
    fullName: 'Quản Trị Viên',
    role: 'ADMIN',
    email: 'admin@gym.local',
    passwordHash,
  });
  await upsertUser({
    phone: '0900000011',
    fullName: 'Lễ Tân Ca Sáng',
    role: 'STAFF',
    shift: 'MORNING',
    passwordHash,
  });
  await upsertUser({
    phone: '0900000012',
    fullName: 'Lễ Tân Ca Chiều',
    role: 'STAFF',
    shift: 'AFTERNOON',
    passwordHash,
  });

  const trainers = [
    { phone: '0900000021', fullName: 'PT Tăng Cơ', specialties: ['Tăng cơ', 'Sức mạnh'], experienceYears: 5 },
    { phone: '0900000022', fullName: 'PT Giảm Mỡ', specialties: ['Giảm mỡ', 'Cardio'], experienceYears: 3 },
    { phone: '0900000023', fullName: 'PT Yoga', specialties: ['Yoga', 'Phục hồi'], experienceYears: 4 },
  ];
  for (const t of trainers) {
    const user = await upsertUser({ phone: t.phone, fullName: t.fullName, role: 'TRAINER', passwordHash });
    await prisma.trainer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specialties: t.specialties,
        experienceYears: t.experienceYears,
        bio: 'Hồ sơ demo',
      },
    });
  }

  // ---------- 30 hội viên ----------
  for (let i = 1; i <= 30; i++) {
    const phone = `09100000${String(i).padStart(2, '0')}`;
    const user = await upsertUser({
      phone,
      fullName: memberName(i),
      role: 'MEMBER',
      // Một nửa có email, một nửa không (Q15: email không bắt buộc)
      email: i % 2 === 0 ? `hv${i}@gym.local` : undefined,
      passwordHash,
    });
    await prisma.member.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        memberCode: `HV${String(i).padStart(6, '0')}`,
        qrToken: randomBytes(16).toString('hex'),
      },
    });
  }

  // ---------- 5 gói (SỐ DEMO) ----------
  const packages: Prisma.PackageCreateInput[] = [
    {
      name: 'Gym 1 tháng',
      type: 'GYM',
      price: 300000,
      durationValue: 1,
      durationUnit: 'MONTH',
      benefits: ['Tủ đồ'],
    },
    {
      name: 'Gym 3 tháng',
      type: 'GYM',
      price: 800000,
      durationValue: 3,
      durationUnit: 'MONTH',
      benefits: ['Tủ đồ', 'Khăn'],
    },
    {
      name: 'Gym 12 tháng kèm lớp',
      type: 'GYM',
      price: 2800000,
      durationValue: 12,
      durationUnit: 'MONTH',
      includesClass: true,
      benefits: ['Tủ đồ', 'Khăn', 'Lớp nhóm'],
    },
    {
      name: 'PT 12 buổi',
      type: 'PT',
      price: 3600000,
      durationValue: 2,
      durationUnit: 'MONTH',
      totalSessions: 12,
      sessionMinutes: 60,
      benefits: ['Kế hoạch tập riêng'],
    },
    {
      name: 'PT 24 buổi kèm lớp',
      type: 'PT',
      price: 6600000,
      durationValue: 3,
      durationUnit: 'MONTH',
      totalSessions: 24,
      sessionMinutes: 60,
      includesClass: true,
      benefits: ['Kế hoạch tập riêng', 'Lớp nhóm'],
    },
  ];
  for (const p of packages) {
    const existing = await prisma.package.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.package.create({ data: p });
    }
  }

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.member.count(),
    prisma.trainer.count(),
    prisma.package.count(),
  ]);
  // Logger của Nest không có ở đây; seed là script dòng lệnh nên in ra màn hình.
  process.stdout.write(
    `Seed xong: ${counts[0]} tài khoản, ${counts[1]} hội viên, ${counts[2]} PT, ${counts[3]} gói\n`,
  );
}

main()
  .catch((e) => {
    process.stderr.write(`Seed lỗi: ${String(e)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
