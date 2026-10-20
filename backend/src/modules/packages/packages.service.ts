import { Injectable } from '@nestjs/common';
import { Prisma, type PackageType } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AuditService } from '../../common/audit/audit.service';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import type { FieldError } from '../../common/http/validation';
import { assertFound } from '../../common/ownership/ownership';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreatePackageDto } from './dto/create-package.dto';
import type { ListPackagesQueryDto } from './dto/list-packages-query.dto';
import type { UpdatePackageDto } from './dto/update-package.dto';
import { toPackageResponse, type PackageResponse } from './package.response';

/** Ký tự đặc biệt của LIKE phải thoát để tìm đúng chữ người dùng gõ. */
const escapeLike = (s: string): string => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Gói PT bắt buộc số buổi và số phút mỗi buổi; gói GYM không có (openapi createPackage, ERD).
 * DB cũng có CHECK packages_sessions_by_type, kiểm ở đây để trả VALIDATION_ERROR thay vì 500.
 */
const checkSessions = (
  type: PackageType,
  totalSessions: number | null | undefined,
  sessionMinutes: number | null | undefined,
): void => {
  const errors: FieldError[] = [];
  const fields = { totalSessions, sessionMinutes };
  for (const [field, value] of Object.entries(fields)) {
    const empty = value === null || value === undefined;
    if (type === 'PT' && empty) errors.push({ field, messages: [`${field} bắt buộc với gói PT`] });
    if (type === 'GYM' && !empty) errors.push({ field, messages: [`${field} phải để trống với gói GYM`] });
  }
  if (errors.length > 0) throw new AppError('VALIDATION_ERROR', errors);
};

@Injectable()
export class PackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** UC07. Khách, hội viên chỉ thấy gói ACTIVE; Admin thấy mọi trạng thái và lọc được theo status. */
  async list(query: ListPackagesQueryDto, user?: AuthUser) {
    const isAdmin = user?.role === 'ADMIN';
    const where: Prisma.PackageWhereInput = {
      status: isAdmin ? query.status : 'ACTIVE',
      type: query.type,
      durationUnit: query.durationUnit,
      durationValue: query.durationValue,
      price: { gte: query.minPrice, lte: query.maxPrice },
    };

    if (query.q) {
      // Tìm không dấu, không phân biệt hoa thường (immutable_unaccent trong migration init)
      const pattern = `%${escapeLike(query.q)}%`;
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM packages
        WHERE immutable_unaccent(lower(name)) LIKE immutable_unaccent(lower(${pattern}))`;
      where.id = { in: rows.map((r) => r.id) };
    }

    const { page, pageSize } = query;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.package.count({ where }),
      this.prisma.package.findMany({
        where,
        orderBy: [{ price: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: items.map(toPackageResponse),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /** UC07. Ai cũng xem được, kể cả gói ngừng bán (để mở lại link cũ). */
  async get(id: string): Promise<PackageResponse> {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const pkg = await this.prisma.package.findUnique({ where: { id } });
    assertFound(pkg);
    return toPackageResponse(pkg);
  }

  /** UC08. Gói mới luôn ACTIVE; ghi audit. */
  async create(dto: CreatePackageDto, user: AuthUser): Promise<PackageResponse> {
    checkSessions(dto.type, dto.totalSessions, dto.sessionMinutes);

    return this.prisma.$transaction(async (tx) => {
      const pkg = await tx.package.create({
        data: {
          name: dto.name,
          description: dto.description ?? null,
          type: dto.type,
          price: dto.price,
          durationValue: dto.durationValue,
          durationUnit: dto.durationUnit,
          totalSessions: dto.totalSessions ?? null,
          sessionMinutes: dto.sessionMinutes ?? null,
          includesClass: dto.includesClass,
          benefits: dto.benefits ?? [],
        },
      });
      const after = toPackageResponse(pkg);
      await this.audit.log(tx, {
        actorId: user.id,
        action: 'PACKAGE_CREATE',
        targetType: 'package',
        targetId: pkg.id,
        after,
      });
      return after;
    });
  }

  /**
   * UC08. Chỉ đổi field được gửi; không đổi được type. Ghi audit trước/sau.
   * Đơn và gói hội viên đã có không đổi vì đã chụp điều khoản lúc mua (domain.md).
   */
  async update(id: string, dto: UpdatePackageDto, user: AuthUser): Promise<PackageResponse> {
    // DTO có sẵn mọi field (giá trị undefined), nên đếm field được gửi chứ không đếm key
    if (Object.values(dto).every((v) => v === undefined)) {
      throw new AppError('VALIDATION_ERROR', [{ field: 'body', messages: ['Cần ít nhất một field'] }]);
    }
    if (!isUUID(id)) throw new AppError('NOT_FOUND');

    return this.prisma.$transaction(async (tx) => {
      // Khóa dòng để giá trị "trước" trong audit đúng khi hai Admin sửa cùng lúc
      await tx.$queryRaw`SELECT id FROM packages WHERE id = ${id}::uuid FOR UPDATE`;
      const existing = await tx.package.findUnique({ where: { id } });
      assertFound(existing);

      checkSessions(
        existing.type,
        dto.totalSessions !== undefined ? dto.totalSessions : existing.totalSessions,
        dto.sessionMinutes !== undefined ? dto.sessionMinutes : existing.sessionMinutes,
      );

      const pkg = await tx.package.update({ where: { id }, data: dto });
      const before = toPackageResponse(existing);
      const after = toPackageResponse(pkg);
      await this.audit.log(tx, {
        actorId: user.id,
        action: 'PACKAGE_UPDATE',
        targetType: 'package',
        targetId: id,
        before,
        after,
      });
      return after;
    });
  }
}
