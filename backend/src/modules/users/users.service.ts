import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { isUUID } from 'class-validator';
import { AuditService } from '../../common/audit/audit.service';
import { AppError } from '../../common/errors/app-error';
import { isEmptyPatch } from '../../common/http/patch';
import type { AuthUser } from '../../common/http/request-context';
import { pageMeta } from '../../common/notify';
import { assertFound } from '../../common/ownership/ownership';
import { BUSINESS } from '../../config/business.config';
import { PrismaService } from '../../prisma/prisma.service';
import { fromDateOnly } from '../members/member.response';
import type {
  CreateUserDto,
  ListUsersQueryDto,
  UpdateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/user.dto';
import { toUserResponse } from './user.response';

const escapeLike = (s: string): string => s.replace(/[\\%_]/g, (c) => `\\${c}`);
const fieldError = (field: string, message: string) =>
  new AppError('VALIDATION_ERROR', [{ field, messages: [message] }], message);

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** UC31. Tìm theo tên không dấu, SĐT hoặc email; mới tạo trước. */
  async list(query: ListUsersQueryDto) {
    const conditions: Prisma.UserWhereInput[] = [{ role: query.role }, { status: query.status }];
    if (query.q) {
      const pattern = `%${escapeLike(query.q)}%`;
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM users
        WHERE immutable_unaccent(lower(full_name)) LIKE immutable_unaccent(lower(${pattern}))
           OR phone LIKE ${pattern}
           OR lower(coalesce(email, '')) LIKE lower(${pattern})`;
      conditions.push({ id: { in: rows.map((r) => r.id) } });
    }
    const where: Prisma.UserWhereInput = { AND: conditions };
    const { page, pageSize } = query;
    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { trainer: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { data: users.map(toUserResponse), meta: pageMeta(page, pageSize, total) };
  }

  async get(id: string) {
    return toUserResponse(await this.load(id));
  }

  /** UC32. Tạo Staff hoặc PT; PT kèm hồ sơ. Admin đặt mật khẩu ban đầu. */
  async create(dto: CreateUserDto) {
    if (dto.role === 'TRAINER' && !dto.trainer) throw fieldError('trainer', 'Tài khoản PT cần hồ sơ PT');
    if (dto.role !== 'STAFF' && dto.shift) throw fieldError('shift', 'Chỉ Staff có ca làm');
    await this.assertContactFree(dto.phone, dto.email ?? null);

    try {
      const user = await this.prisma.user.create({
        data: {
          role: dto.role,
          fullName: dto.fullName,
          phone: dto.phone,
          email: dto.email ?? null,
          dob: dto.dob ? fromDateOnly(dto.dob) : null,
          passwordHash: await bcrypt.hash(dto.password, BUSINESS.auth.bcryptCost),
          shift: dto.role === 'STAFF' ? (dto.shift ?? null) : null,
          trainer:
            dto.role === 'TRAINER'
              ? {
                  create: {
                    specialties: dto.trainer?.specialties ?? [],
                    bio: dto.trainer?.bio ?? null,
                    experienceYears: dto.trainer?.experienceYears ?? null,
                  },
                }
              : undefined,
        },
        include: { trainer: true },
      });
      return toUserResponse(user);
    } catch (e) {
      await this.rethrowDuplicate(e, dto.phone, dto.email ?? null);
      throw e;
    }
  }

  /** UC33. Không đổi vai trò, trạng thái ở đây; `shift` chỉ cho STAFF. */
  async update(id: string, dto: UpdateUserDto) {
    if (isEmptyPatch(dto)) throw fieldError('body', 'Cần gửi ít nhất một field');
    const current = await this.load(id);
    if (dto.shift !== undefined && current.role !== 'STAFF') throw fieldError('shift', 'Chỉ Staff có ca làm');
    await this.assertContactFree(dto.phone ?? null, dto.email ?? null, id);

    const { dob, ...fields } = dto;
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { ...fields, ...(dob !== undefined ? { dob: dob ? fromDateOnly(dob) : null } : {}) },
        include: { trainer: true },
      });
      return toUserResponse(user);
    } catch (e) {
      await this.rethrowDuplicate(e, dto.phone ?? null, dto.email ?? null, id);
      throw e;
    }
  }

  /** UC34. Khóa thì tăng token_version để đăng xuất mọi thiết bị. Không tự khóa mình. */
  async updateStatus(id: string, dto: UpdateUserStatusDto, actor: AuthUser) {
    if (id === actor.id) throw new AppError('FORBIDDEN', null, 'Không tự khóa tài khoản của mình');
    const before = await this.load(id);
    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { status: dto.status, tokenVersion: { increment: 1 } },
        include: { trainer: true },
      });
      await this.audit.log(tx, {
        actorId: actor.id,
        action: dto.status === 'LOCKED' ? 'USER_LOCK' : 'USER_UNLOCK',
        targetType: 'user',
        targetId: id,
        before: { status: before.status },
        after: { status: dto.status },
        reason: dto.reason,
      });
      return updated;
    });
    return toUserResponse(user);
  }

  /**
   * UC35. Chỉ đổi giữa ADMIN, STAFF, TRAINER. PT còn lịch hoặc lớp tương lai thì không đổi được.
   * Sang TRAINER thì tạo hồ sơ PT trống. Người bị đổi bị đăng xuất mọi thiết bị.
   */
  async updateRole(id: string, dto: UpdateUserRoleDto, actor: AuthUser) {
    const before = await this.load(id);
    if (before.role === 'MEMBER')
      throw new AppError('ROLE_CHANGE_NOT_ALLOWED', null, 'Không đổi vai trò hội viên');
    if (before.role === dto.role) return toUserResponse(before);

    if (before.role === 'TRAINER' && before.trainer) {
      const now = new Date();
      const [appointments, classes] = await Promise.all([
        this.prisma.appointment.count({
          where: {
            trainerId: before.trainer.id,
            status: { in: ['PENDING', 'CONFIRMED'] },
            startsAt: { gt: now },
          },
        }),
        this.prisma.class.count({
          where: { trainerId: before.trainer.id, status: 'SCHEDULED', startsAt: { gt: now } },
        }),
      ]);
      if (appointments + classes > 0) {
        throw new AppError(
          'ROLE_CHANGE_NOT_ALLOWED',
          { appointments, classes },
          'PT còn lịch hoặc lớp sắp tới',
        );
      }
    }

    const user = await this.prisma.$transaction(async (tx) => {
      if (dto.role === 'TRAINER' && !before.trainer) await tx.trainer.create({ data: { userId: id } });
      const updated = await tx.user.update({
        where: { id },
        data: { role: dto.role, tokenVersion: { increment: 1 } },
        include: { trainer: true },
      });
      await this.audit.log(tx, {
        actorId: actor.id,
        action: 'USER_ROLE_CHANGE',
        targetType: 'user',
        targetId: id,
        before: { role: before.role },
        after: { role: dto.role },
        reason: dto.reason,
      });
      return updated;
    });
    return toUserResponse(user);
  }

  private async load(id: string) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const user = await this.prisma.user.findUnique({ where: { id }, include: { trainer: true } });
    assertFound(user);
    return user;
  }

  private async assertContactFree(phone: string | null, email: string | null, exceptId?: string) {
    if (phone) {
      const byPhone = await this.prisma.user.findUnique({ where: { phone } });
      if (byPhone && byPhone.id !== exceptId) throw new AppError('PHONE_DUPLICATED');
    }
    if (email) {
      const byEmail = await this.prisma.user.findUnique({ where: { email } });
      if (byEmail && byEmail.id !== exceptId) throw new AppError('EMAIL_DUPLICATED');
    }
  }

  private async rethrowDuplicate(e: unknown, phone: string | null, email: string | null, exceptId?: string) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      await this.assertContactFree(phone, email, exceptId);
    }
  }
}
