import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type AuditEntry = {
  /** users.id của người thực hiện */
  actorId: string;
  /** PACKAGE_CREATE, PACKAGE_UPDATE, CASH_CONFIRM, SUBSCRIPTION_FREEZE, USER_LOCK, USER_ROLE_CHANGE, ... */
  action: string;
  /** Tên bảng số ít: package, order, subscription, user, ... */
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
};

/** null phải ghi thành SQL NULL; Prisma không nhận `null` trần cho cột Json. */
const toJson = (value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  value === undefined || value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);

/**
 * Ghi nhật ký thao tác nhạy cảm (`.claude/rules/backend.md`, mục Lỗi và log).
 * Luôn gọi trong cùng transaction với thao tác chính, để hai việc cùng thành công hoặc cùng hủy:
 *
 *   await this.prisma.$transaction(async (tx) => {
 *     const pkg = await tx.package.update(...);
 *     await this.audit.log(tx, { actorId: user.id, action: 'PACKAGE_UPDATE', targetType: 'package', targetId: pkg.id, before, after });
 *   });
 *
 * Bảng audit_logs chỉ INSERT (trigger trong migration chặn sửa, xóa).
 */
@Injectable()
export class AuditService {
  async log(tx: Prisma.TransactionClient, entry: AuditEntry): Promise<void> {
    await tx.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        before: toJson(entry.before),
        after: toJson(entry.after),
        reason: entry.reason ?? null,
      },
    });
  }
}
