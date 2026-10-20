import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { BUSINESS } from '../../../config/business.config';

/** Query của GET /members (openapi: listMembers). */
export class ListMembersQueryDto {
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

  /** Tên (không dấu), SĐT hoặc mã hội viên. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  /** Query string chỉ nhận "true"/"false"; giá trị khác giữ nguyên để IsBoolean báo lỗi. */
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  hasActiveSubscription?: boolean;
}
