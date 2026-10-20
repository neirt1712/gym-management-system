/**
 * Tham số nghiệp vụ dùng chung. Chủ file: Hồng Anh.
 * Mỗi con số ghi nguồn. Con số chưa có tài liệu chốt thì để TODO, KHÔNG tự đặt.
 * Module đọc qua `import { BUSINESS } from '../config/business.config'`.
 */
export const BUSINESS = {
  timezone: 'Asia/Ho_Chi_Minh',

  auth: {
    /** ADR 0001 / .claude/rules/backend.md */
    accessTokenMinutes: 15,
    bcryptCost: 10,
    /** be-plan tuần 2: khóa tạm sau 5 lần sai */
    maxFailedLogins: 5,
    /** TODO(Triển): thời gian khóa tạm chưa có tài liệu chốt */
    tempLockMinutes: undefined as number | undefined,
    /** decisions.md #1: link đặt lại mật khẩu hạn 30 phút */
    passwordResetTokenMinutes: 30,
  },

  orders: {
    /** decisions.md #9: đơn VNPay hết hạn sau 30 phút */
    vnpayPendingMinutes: 30,
    /** decisions.md #9: đơn tiền mặt hết hạn cuối ngày (giờ VN) */
    cashExpiresAtEndOfDay: true,
  },

  freeze: {
    /** decisions.md #10: tối đa 1 lần mỗi gói, 30 ngày */
    maxTimesPerSubscription: 1,
    maxDays: 30,
  },

  classes: {
    /** decisions.md #11: hạn hủy đăng ký lớp mặc định 120 phút */
    defaultCancelBeforeMinutes: 120,
  },

  pagination: {
    /** .claude/rules/backend.md */
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  /** decisions.md #17: mốc job nền (giờ VN) */
  jobs: {
    expiringSubscriptionNoticeDays: 7,
    expiringSubscriptionNoticeCron: '0 8 * * *',
    appointmentReminderHoursBefore: 2,
    autoCheckoutCron: '59 23 * * *',
    trainerConfirmReminderHours: 24,
    expirePendingOrdersCron: '*/5 * * * *',
  },
} as const;
