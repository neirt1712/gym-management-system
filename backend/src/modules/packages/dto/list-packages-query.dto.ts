import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { DurationUnit, PackageStatus, PackageType } from '@prisma/client';
import { BUSINESS } from '../../../config/business.config';

/** Query của GET /packages (openapi: listPackages). */
export class ListPackagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(BUSINESS.pagination.maxPageSize)
  pageSize: number = BUSINESS.pagination.defaultPageSize;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsEnum(PackageType)
  type?: PackageType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(DurationUnit)
  durationUnit?: DurationUnit;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationValue?: number;

  /** Chỉ Admin dùng được; vai trò khác luôn chỉ thấy gói ACTIVE. */
  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;
}
