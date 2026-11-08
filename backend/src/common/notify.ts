import type { Prisma } from '@prisma/client';

export type NotificationInput = {
  userId: string;
  /** PAYMENT_SUCCESS, APPOINTMENT_PROPOSED, APPOINTMENT_CONFIRMED, ... (openapi Notification.type) */
  type: string;
  title: string;
  body: string;
  /** ORDER, SUBSCRIPTION, APPOINTMENT, CLASS: FE dùng để mở màn liên quan. */
  targetType?: string;
  targetId?: string;
};

/** Tạo thông báo trong cùng transaction với thao tác chính. */
export const notify = (tx: Prisma.TransactionClient, input: NotificationInput) =>
  tx.notification.create({ data: input });

/** Vi phạm ràng buộc EXCLUDE (chống chồng giờ) của PostgreSQL: mã 23P01. */
export const isExclusionViolation = (e: unknown): boolean => {
  const text = e instanceof Error ? e.message : String(e);
  return text.includes('23P01') || text.includes('exclusion constraint');
};

/** openapi PageMeta. */
export const pageMeta = (page: number, pageSize: number, total: number) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});
