import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { isUUID } from 'class-validator';
import { AuditService } from '../../common/audit/audit.service';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { assertFound } from '../../common/ownership/ownership';
import { BUSINESS } from '../../config/business.config';
import { PrismaService } from '../../prisma/prisma.service';
import type { DeskResetPasswordDto } from './dto/desk-reset-password.dto';

/**
 * UC04, UC20 · Q15: khách không có email đặt lại mật khẩu (hoặc kích hoạt) tại quầy.
 * Khách tự gõ mật khẩu mới; Staff không biết mật khẩu. Thu hồi mọi phiên cũ, mở khóa tạm, ghi audit.
 */
@Injectable()
export class MemberPasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async resetAtDesk(memberId: string, dto: DeskResetPasswordDto, actor: AuthUser): Promise<void> {
    if (!isUUID(memberId)) throw new AppError('NOT_FOUND');
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: { user: { select: { id: true, passwordHash: true } } },
    });
    assertFound(member);

    const passwordHash = await bcrypt.hash(dto.newPassword, BUSINESS.auth.bcryptCost);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: member.user.id },
        data: { passwordHash, tokenVersion: { increment: 1 }, failedLogins: 0, lockedUntil: null },
      });
      await this.audit.log(tx, {
        actorId: actor.id,
        action: member.user.passwordHash ? 'MEMBER_PASSWORD_RESET' : 'MEMBER_ACTIVATE',
        targetType: 'user',
        targetId: member.user.id,
        reason: 'Đặt mật khẩu tại quầy (Q15)',
      });
    });
  }
}
