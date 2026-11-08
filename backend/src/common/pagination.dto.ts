import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { BUSINESS } from '../config/business.config';

/** Phân trang dùng chung: mặc định 20, tối đa 100 (.claude/rules/backend.md). */
export class PageQueryDto {
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
}
