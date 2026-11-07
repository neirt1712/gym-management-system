import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { fromDateOnly } from '../members/member.response';
import type { UpdateMeDto } from './dto/update-me.dto';
import { toMeResponse } from './me.response';

/** Khách hàng hay hội viên luôn tính ra từ gói ACTIVE, không lưu cột (quy tắc nghiệp vụ). */
const ME_INCLUDE = {
  member: { include: { subscriptions: { where: { status: 'ACTIVE' }, select: { id: true }, take: 1 } } },
  trainer: true,
} satisfies Prisma.UserInclude;

const isUniqueViolation = (e: unknown): boolean =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  /** UC05, UC15. */
  async get(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { id: authUser.id }, include: ME_INCLUDE });
    if (!user) throw new AppError('UNAUTHENTICATED');
    return toMeResponse(user);
  }

  /** UC05. Không đổi SĐT, vai trò, trạng thái ở đây; nhóm `trainer` chỉ PT được gửi. */
  async update(dto: UpdateMeDto, authUser: AuthUser) {
    const { trainer, dob, ...fields } = dto;
    if (Object.keys(dto).length === 0) {
      throw new AppError('VALIDATION_ERROR', [{ field: 'body', messages: ['Cần gửi ít nhất một field'] }]);
    }
    if (trainer && authUser.role !== 'TRAINER') {
      throw new AppError('VALIDATION_ERROR', [{ field: 'trainer', messages: ['Chỉ PT được gửi nhóm này'] }]);
    }

    const data: Prisma.UserUpdateInput = { ...fields };
    if (dob !== undefined) data.dob = dob ? fromDateOnly(dob) : null;
    if (trainer) data.trainer = { update: { ...trainer } };

    try {
      const user = await this.prisma.user.update({
        where: { id: authUser.id },
        data,
        include: ME_INCLUDE,
      });
      return toMeResponse(user);
    } catch (e) {
      if (isUniqueViolation(e)) throw new AppError('EMAIL_DUPLICATED');
      throw e;
    }
  }

  /** UC15, Q6. Mã cũ hết hiệu lực ngay. */
  async regenerateQrToken(authUser: AuthUser) {
    const member = await this.prisma.member.update({
      where: { userId: authUser.id },
      data: { qrToken: randomBytes(16).toString('hex') },
      select: { qrToken: true },
    });
    return { qrToken: member.qrToken };
  }
}
