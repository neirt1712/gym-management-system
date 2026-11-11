import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { isUUID } from 'class-validator';
import { AuditService } from '../../common/audit/audit.service';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
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
import { toUserResponse, type UserResponse } from './user.response';

/** Ký tự đặc biệt của LIKE phải thoát để tìm đúng chữ người dùng gõ. */
const escapeLike = (s: string): string => s.replace(/[\\%_]/g, (c) => `\\${c}`);

const fieldError = (field: string, message: string) =>
  new AppError('VALIDATION_ERROR', [{ field, messages: [message] }]);

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** UC31. Mọi vai trò, lọc theo role, status, tìm tên không dấu/SĐT/email; mới nhất trước. */
  async list(query: ListUsersQueryDto) {
    const conditions: Prisma.UserWhereInput[] = [];
    if (query.role) conditions.push({ role: query.role });
    if (query.status) conditions.push({ status: query.status });
    if (query.q) {
      const pattern = `%${escapeLike(query.q)}%`;
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM users
        WHERE immutable_unaccent(lower(full_name)) LIKE immutable_unaccent(lower(${pattern}))
           OR phone LIKE ${pattern}
           OR lower(email) LIKE lower(${pattern})`;
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
    return {
      data: users.map(toUserResponse),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /** UC31. */
  async get(id: string): Promise<UserResponse> {
    return toUserResponse(await this.findOrThrow(this.prisma, id));
  }

  /** UC32. Tạo Staff hoặc PT; PT có hồ sơ trainers trong cùng transaction. */
  async create(dto: CreateUserDto): Promise<UserResponse> {
    if (dto.role === 'TRAINER' && !dto.trainer) {
      throw fieldError('trainer', 'trainer là bắt buộc khi role = TRAINER');
    }
    if (dto.role === 'STAFF' && dto.trainer) {
      throw fieldError('trainer', 'trainer chỉ dùng khi role = TRAINER');
    }
    if (dto.role === 'TRAINER' && dto.shift != null) {
      throw fieldError('shift', 'shift chỉ dùng cho STAFF');
    }
    const email = dto.email ?? null;
    await this.assertContactFree(dto.phone, email);

    const passwordHash = await bcrypt.hash(dto.password, BUSINESS.auth.bcryptCost);
    try {
      const user = await this.prisma.user.create({
        data: {
          role: dto.role,
          fullName: dto.fullName,
          phone: dto.phone,
          email,
          dob: dto.dob ? fromDateOnly(dto.dob) : null,
          passwordHash,
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
      await this.rethrowDuplicate(e, dto.phone, email);
      throw e;
    }
  }

  /** UC33. Chỉ đổi field được gửi; không đổi vai trò, trạng thái ở đây. */
  async update(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    // DTO có sẵn mọi field (giá trị undefined), nên đếm field được gửi chứ không đếm key
    if (Object.values(dto).every((v) => v === undefined)) {
      throw fieldError('body', 'Cần ít nhất một field');
    }
    const existing = await this.findOrThrow(this.prisma, id);
    if (dto.shift != null && existing.role !== 'STAFF') {
      throw fieldError('shift', 'shift chỉ dùng cho STAFF');
    }
    await this.assertContactFree(dto.phone ?? null, dto.email ?? null, existing.id);

    try {
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          email: dto.email,
          dob: dto.dob === undefined ? undefined : dto.dob === null ? null : fromDateOnly(dto.dob),
          shift: dto.shift,
        },
        include: { trainer: true },
      });
      return toUserResponse(user);
    } catch (e) {
      await this.rethrowDuplicate(e, dto.phone ?? null, dto.email ?? null, existing.id);
      throw e;
    }
  }

  /**
   * UC34. Khóa thì tăng token_version để đăng xuất mọi thiết bị; Admin không tự khóa mình.
   * Ghi audit USER_LOCK / USER_UNLOCK cùng transaction.
   */
  async updateStatus(id: string, dto: UpdateUserStatusDto, actor: AuthUser): Promise<UserResponse> {
    if (dto.status === 'LOCKED' && id === actor.id) throw new AppError('FORBIDDEN');

    return this.prisma.$transaction(async (tx) => {
      const existing = await this.lockRow(tx, id);
      const updated = await tx.user.update({
        where: { id: existing.id },
        data: {
          status: dto.status,
          tokenVersion: dto.status === 'LOCKED' ? { increment: 1 } : undefined,
        },
        include: { trainer: true },
      });
      await this.audit.log(tx, {
        actorId: actor.id,
        action: dto.status === 'LOCKED' ? 'USER_LOCK' : 'USER_UNLOCK',
        targetType: 'user',
        targetId: existing.id,
        before: { status: existing.status },
        after: { status: updated.status },
        reason: dto.reason,
      });
      return toUserResponse(updated);
    });
  }

  /**
   * UC35. Chỉ đổi giữa ADMIN, STAFF, TRAINER. PT còn lịch PT hoặc lớp trong tương lai thì không đổi được.
   * Sang TRAINER: tạo (hoặc bật lại) hồ sơ PT. Người bị đổi bị đăng xuất mọi thiết bị. Ghi audit.
   */
  async updateRole(id: string, dto: UpdateUserRoleDto, actor: AuthUser): Promise<UserResponse> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.lockRow(tx, id);
      if (existing.role === 'MEMBER' || dto.role === 'MEMBER') {
        throw new AppError('ROLE_CHANGE_NOT_ALLOWED', { reason: 'MEMBER_ROLE' });
      }

      if (existing.role === 'TRAINER' && dto.role !== 'TRAINER' && existing.trainer) {
        const now = new Date();
        const [appointments, classes] = await Promise.all([
          tx.appointment.count({
            where: {
              trainerId: existing.trainer.id,
              status: { in: ['PENDING', 'CONFIRMED'] },
              startsAt: { gt: now },
            },
          }),
          tx.class.count({
            where: { trainerId: existing.trainer.id, status: 'SCHEDULED', startsAt: { gt: now } },
          }),
        ]);
        if (appointments > 0 || classes > 0) {
          throw new AppError('ROLE_CHANGE_NOT_ALLOWED', {
            reason: 'TRAINER_HAS_FUTURE_SCHEDULE',
            appointments,
            classes,
          });
        }
        // Giữ dòng trainers (lịch sử lịch PT, ghi chú tham chiếu tới nó), chỉ ngừng hoạt động
        await tx.trainer.update({ where: { id: existing.trainer.id }, data: { status: 'INACTIVE' } });
      }

      if (dto.role === 'TRAINER') {
        await tx.trainer.upsert({
          where: { userId: existing.id },
          create: { userId: existing.id },
          update: { status: 'ACTIVE' },
        });
      }

      const updated = await tx.user.update({
        where: { id: existing.id },
        data: {
          role: dto.role,
          // Ca làm chỉ có nghĩa với STAFF
          shift: dto.role === 'STAFF' ? undefined : null,
          tokenVersion: { increment: 1 },
        },
        include: { trainer: true },
      });
      await this.audit.log(tx, {
        actorId: actor.id,
        action: 'USER_ROLE_CHANGE',
        targetType: 'user',
        targetId: existing.id,
        before: { role: existing.role },
        after: { role: updated.role },
        reason: dto.reason,
      });
      return toUserResponse(updated);
    });
  }

  private async findOrThrow(db: Prisma.TransactionClient, id: string) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const user = await db.user.findUnique({ where: { id }, include: { trainer: true } });
    assertFound(user);
    return user;
  }

  /** Khóa dòng users để hai Admin đổi cùng lúc không ghi audit "trước" sai. */
  private async lockRow(tx: Prisma.TransactionClient, id: string) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${id}::uuid FOR UPDATE`;
    return this.findOrThrow(tx, id);
  }

  private async assertContactFree(phone: string | null, email: string | null, exceptUserId?: string) {
    if (phone) {
      const owner = await this.prisma.user.findUnique({ where: { phone }, select: { id: true } });
      if (owner && owner.id !== exceptUserId) throw new AppError('PHONE_DUPLICATED');
    }
    if (email) {
      const owner = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (owner && owner.id !== exceptUserId) throw new AppError('EMAIL_DUPLICATED');
    }
  }

  /** Hai yêu cầu cùng lúc lọt qua bước kiểm tra thì unique của DB chặn (P2002); đổi về đúng mã nghiệp vụ. */
  private async rethrowDuplicate(
    e: unknown,
    phone: string | null,
    email: string | null,
    exceptUserId?: string,
  ): Promise<void> {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return;
    await this.assertContactFree(phone, email, exceptUserId);
    const target = String(e.meta?.target ?? '');
    if (target.includes('phone')) throw new AppError('PHONE_DUPLICATED');
    if (target.includes('email')) throw new AppError('EMAIL_DUPLICATED');
  }
}
