import { PackageType, SubscriptionStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { BUSINESS } from '../../../config/business.config';

/** Query của GET /subscriptions. Lọc nhiều trạng thái: `status=ACTIVE&status=FROZEN`. */
export class ListSubscriptionsQueryDto {
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
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(SubscriptionStatus, { each: true })
  status?: SubscriptionStatus[];

  @IsOptional()
  @IsEnum(PackageType)
  type?: PackageType;
}
