/**
 * Thông điệp tiếng Việt theo error.code. Nguồn duy nhất: docs/api/error-codes.md (cột "Thông điệp FE").
 * Thêm mã mới ở file đó trước, rồi chép sang đây. Không viết chuỗi lỗi rời trong component.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Thông tin chưa hợp lệ. Kiểm tra các ô được đánh dấu.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  NOT_FOUND: 'Không tìm thấy dữ liệu. Có thể đã bị xóa hoặc bạn không có quyền xem.',
  INVALID_CREDENTIALS: 'Sai tài khoản hoặc mật khẩu.',
  ACCOUNT_LOCKED: 'Tài khoản đã bị khóa. Liên hệ quầy để được hỗ trợ.',
  ACCOUNT_TEMPORARILY_LOCKED: 'Bạn đăng nhập sai nhiều lần. Thử lại sau ít phút.',
  ACTIVATION_REQUIRED: 'Số điện thoại này đã có hồ sơ tại quầy. Kích hoạt tài khoản để tiếp tục.',
  PHONE_DUPLICATED: 'Số điện thoại đã được dùng.',
  EMAIL_DUPLICATED: 'Email đã được dùng.',
  TOKEN_EXPIRED: 'Liên kết đã hết hạn. Gửi lại yêu cầu đặt mật khẩu.',
  INVALID_FILE: 'Chỉ nhận ảnh JPEG hoặc PNG.',
  PENDING_ORDER_EXISTS: 'Bạn đang có đơn chờ thanh toán cho gói này. Mở lại đơn đó để thanh toán.',
  ORDER_NOT_PENDING: 'Đơn này không còn chờ thanh toán. Tải lại để xem trạng thái mới.',
  CASH_AMOUNT_MISMATCH: 'Số tiền nhận phải bằng số tiền cần thanh toán.',
  NO_ACTIVE_SUBSCRIPTION: 'Hội viên chưa có gói còn hiệu lực. Mua hoặc gia hạn gói để check-in.',
  SUBSCRIPTION_EXPIRED: 'Gói đã hết hạn. Gia hạn để check-in.',
  SUBSCRIPTION_FROZEN: 'Gói đang bảo lưu. Mở lại gói để check-in.',
  ALREADY_CHECKED_IN: 'Hội viên đang trong phòng tập. Check-out lượt trước trước.',
  INVALID_QR: 'Không nhận ra mã QR. Thử nhập số điện thoại.',
  SUBSCRIPTION_NOT_ACTIVE: 'Chỉ bảo lưu được gói đang hiệu lực.',
  SUBSCRIPTION_NOT_FROZEN: 'Gói này không ở trạng thái bảo lưu.',
  FREEZE_BLOCKED_BY_APPOINTMENTS:
    'Gói còn lịch tập sắp tới. Hủy hoặc hoàn tất các lịch đó trước khi bảo lưu.',
  FREEZE_LIMIT_REACHED: 'Gói này đã bảo lưu một lần, không bảo lưu thêm được.',
  SCHEDULE_CONFLICT: 'Khung giờ này bị trùng lịch. Chọn giờ khác.',
  STALE_VERSION: 'Lịch vừa được bên kia cập nhật. Xem lại đề xuất mới nhất.',
  NO_SESSIONS_AVAILABLE: 'Gói đã hết buổi có thể đặt.',
  OUTSIDE_SUBSCRIPTION_PERIOD: 'Giờ đề xuất nằm ngoài thời hạn gói.',
  SESSION_NOT_ENDED: 'Buổi tập chưa kết thúc nên chưa xác nhận được.',
  NO_CLASS_BENEFIT: 'Gói của bạn không gồm quyền tham gia lớp học.',
  CLASS_FULL: 'Lớp đã đủ chỗ.',
  CLASS_NOT_OPEN: 'Lớp đã hủy hoặc đã bắt đầu, không đăng ký được nữa.',
  CANCELLATION_WINDOW_PASSED: 'Đã quá hạn hủy đăng ký lớp này.',
  ROLE_CHANGE_NOT_ALLOWED: 'Không đổi được vai trò cho tài khoản này.',
  RATE_LIMITED: 'Bạn thao tác quá nhanh. Thử lại sau ít phút.',
  INTERNAL_ERROR: 'Có lỗi xảy ra. Thử lại sau.',
};

const FALLBACK = 'Có lỗi xảy ra. Thử lại sau.';

type FieldDetail = { field?: string; messages?: string[] };

type ApiError = { error?: { code?: string; message?: string; details?: unknown; requestId?: string } };

export const getErrorCode = (err: unknown): string | undefined => (err as ApiError)?.error?.code;

/** Hiện trong phần "Chi tiết lỗi" (chữ nhỏ) để người dùng gửi cho nhóm khi báo lỗi. */
export const getRequestId = (err: unknown): string | undefined => (err as ApiError)?.error?.requestId;

export const getErrorMessage = (err: unknown): string => {
  const code = getErrorCode(err);
  return (code && ERROR_MESSAGES[code]) || FALLBACK;
};

/** `error.details` của lỗi (ví dụ `{ retryAfterSeconds }`, `{ status }`). Không có thì trả undefined. */
export const getErrorDetails = <T = Record<string, unknown>>(err: unknown): T | undefined => {
  const details = (err as ApiError)?.error?.details;
  return details && typeof details === 'object' && !Array.isArray(details) ? (details as T) : undefined;
};

/**
 * `VALIDATION_ERROR` kèm `details: [{ field, messages }]` → dạng `form.setFields` của Ant Design.
 * Chỉ lấy các ô có trong form (`fields`); ô lạ thì bỏ, thông điệp chung vẫn hiện ở Alert đầu form.
 */
export const getFieldErrors = <F extends string>(
  err: unknown,
  fields: readonly F[],
): { name: F; errors: string[] }[] => {
  if (getErrorCode(err) !== 'VALIDATION_ERROR') return [];
  const details = (err as ApiError)?.error?.details;
  if (!Array.isArray(details)) return [];
  const isField = (f: string | undefined): f is F => !!f && (fields as readonly string[]).includes(f);
  return (details as FieldDetail[]).flatMap((d) =>
    isField(d.field) && Array.isArray(d.messages) ? [{ name: d.field, errors: d.messages }] : [],
  );
};
