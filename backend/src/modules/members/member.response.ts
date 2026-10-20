import type {
  AppointmentStatus,
  Member,
  PackageType,
  Subscription,
  SubscriptionStatus,
  User,
  UserStatus,
} from '@prisma/client';

/*
 * TODO(common/time): hai hàm định dạng ngày giờ dưới đây nên chuyển sang common/time khi Triển dựng module đó.
 * Việt Nam không có giờ mùa hè nên lệch cố định +07:00.
 */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** openapi DateTime: ISO 8601 có múi giờ +07:00, ví dụ 2026-10-08T09:30:00+07:00. */
export const toVnDateTime = (d: Date): string =>
  new Date(d.getTime() + VN_OFFSET_MS).toISOString().replace(/\.\d{3}Z$/, '+07:00');

/** openapi DateOnly: cột @db.Date Prisma trả về nửa đêm UTC, lấy phần ngày. */
export const toDateOnly = (d: Date): string => d.toISOString().slice(0, 10);

/** Chuỗi YYYY-MM-DD thành Date cho cột @db.Date. */
export const fromDateOnly = (s: string): Date => new Date(`${s}T00:00:00.000Z`);

export type SessionCounts = {
  total: number;
  used: number;
  held: number;
  remaining: number;
  bookable: number;
};

/**
 * Số buổi PT, tính từ lịch, không lưu cột (domain.md, openapi SessionCounts):
 * used = COMPLETED + NO_SHOW · held = PENDING + CONFIRMED · remaining = total − used · bookable = remaining − held.
 */
export const toSessionCounts = (
  total: number,
  countByStatus: Partial<Record<AppointmentStatus, number>>,
): SessionCounts => {
  const n = (s: AppointmentStatus) => countByStatus[s] ?? 0;
  const used = n('COMPLETED') + n('NO_SHOW');
  const held = n('PENDING') + n('CONFIRMED');
  const remaining = Math.max(total - used, 0);
  return { total, used, held, remaining, bookable: Math.max(remaining - held, 0) };
};

/** Schema `Member` trong openapi (một dòng trong danh sách). */
export type MemberResponse = {
  id: string;
  userId: string;
  memberCode: string;
  fullName: string;
  phone: string;
  email: string | null;
  dob: string | null;
  avatarUrl: string | null;
  accountStatus: UserStatus;
  accountActivated: boolean;
  hasActiveSubscription: boolean;
  createdAt: string;
};

export type SubscriptionSummaryResponse = {
  id: string;
  packageName: string;
  type: PackageType;
  startsOn: string;
  endsOn: string;
  status: SubscriptionStatus;
  includesClass: boolean;
  sessions: SessionCounts | null;
};

/** Schema `MemberDetail` trong openapi. Không có qrToken (chỉ chủ tài khoản thấy qua GET /me). */
export type MemberDetailResponse = MemberResponse & {
  subscriptions: SubscriptionSummaryResponse[];
  currentCheckIn: { id: string; checkedInAt: string } | null;
};

export const toMemberResponse = (
  member: Member & { user: User },
  hasActiveSubscription: boolean,
): MemberResponse => ({
  id: member.id,
  userId: member.userId,
  memberCode: member.memberCode,
  fullName: member.user.fullName,
  phone: member.user.phone,
  email: member.user.email,
  dob: member.user.dob ? toDateOnly(member.user.dob) : null,
  avatarUrl: member.user.avatarUrl,
  accountStatus: member.user.status,
  // Hồ sơ tạo tại quầy chưa đặt mật khẩu thì chưa kích hoạt
  accountActivated: member.user.passwordHash !== null,
  hasActiveSubscription,
  createdAt: toVnDateTime(member.user.createdAt),
});

export const toSubscriptionSummary = (
  sub: Subscription & { package: { type: PackageType } },
  countByStatus: Partial<Record<AppointmentStatus, number>>,
): SubscriptionSummaryResponse => ({
  id: sub.id,
  packageName: sub.packageName,
  type: sub.package.type,
  startsOn: toDateOnly(sub.startsOn),
  endsOn: toDateOnly(sub.endsOn),
  status: sub.status,
  includesClass: sub.includesClass,
  sessions: sub.totalSessions === null ? null : toSessionCounts(sub.totalSessions, countByStatus),
});
