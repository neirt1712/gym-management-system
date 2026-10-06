/**
 * Nhãn tiếng Việt và màu Tag (preset của Ant Design) cho mọi trạng thái trong ERD v3.
 * Dùng qua <StatusTag kind="..." value={...} />. Không tự đặt nhãn/màu ở nơi khác.
 */
type TagColor = 'default' | 'processing' | 'success' | 'warning' | 'error' | 'cyan' | 'purple';
type StatusDef = { label: string; color: TagColor };

export const STATUS = {
  order: {
    PENDING: { label: 'Chờ thanh toán', color: 'warning' },
    PAID: { label: 'Đã thanh toán', color: 'success' },
    CANCELLED: { label: 'Đã hủy', color: 'default' },
    EXPIRED: { label: 'Hết hạn thanh toán', color: 'default' },
  },
  payment: {
    PENDING: { label: 'Đang xử lý', color: 'processing' },
    SUCCESS: { label: 'Thành công', color: 'success' },
    FAILED: { label: 'Thất bại', color: 'error' },
  },
  subscription: {
    ACTIVE: { label: 'Đang hiệu lực', color: 'success' },
    FROZEN: { label: 'Đang bảo lưu', color: 'cyan' },
    EXPIRED: { label: 'Hết hạn', color: 'default' },
    CANCELLED: { label: 'Đã hủy', color: 'default' },
  },
  appointment: {
    PENDING: { label: 'Đang thỏa thuận', color: 'warning' },
    CONFIRMED: { label: 'Đã xác nhận', color: 'processing' },
    REJECTED: { label: 'Bị từ chối', color: 'error' },
    CANCELLED: { label: 'Đã hủy', color: 'default' },
    COMPLETED: { label: 'Đã tập', color: 'success' },
    NO_SHOW: { label: 'Vắng mặt', color: 'error' },
  },
  proposal: {
    OPEN: { label: 'Chờ phản hồi', color: 'warning' },
    ACCEPTED: { label: 'Đã đồng ý', color: 'success' },
    REJECTED: { label: 'Đã từ chối', color: 'error' },
    SUPERSEDED: { label: 'Đã thay bằng đề xuất mới', color: 'default' },
  },
  classSession: {
    SCHEDULED: { label: 'Sắp diễn ra', color: 'processing' },
    CANCELLED: { label: 'Đã hủy', color: 'default' },
  },
  enrollment: {
    REGISTERED: { label: 'Đã đăng ký', color: 'success' },
    CANCELLED: { label: 'Đã hủy đăng ký', color: 'default' },
  },
  account: {
    ACTIVE: { label: 'Hoạt động', color: 'success' },
    LOCKED: { label: 'Đã khóa', color: 'error' },
  },
} as const satisfies Record<string, Record<string, StatusDef>>;

export type StatusKind = keyof typeof STATUS;

/** Nhãn cho kind proposal (đề xuất giờ khác, xin đổi, xin hủy). */
export const PROPOSAL_KIND_LABEL = {
  INITIAL: 'Đề xuất ban đầu',
  COUNTER: 'Đề xuất giờ khác',
  RESCHEDULE: 'Xin đổi lịch',
  CANCEL: 'Xin hủy lịch',
} as const;
