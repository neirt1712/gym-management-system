import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { PageQueryDto } from '../../../common/pagination.dto';
import { DATE_ONLY_PATTERN } from '../../members/dto/create-member.dto';

export const GROUP_BY = ['DAY', 'MONTH', 'YEAR'] as const;
export type GroupBy = (typeof GROUP_BY)[number];

/** Khoảng ngày giờ VN; không gửi thì lấy tháng hiện tại. */
export class DateRangeQueryDto {
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'from phải có dạng YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'to phải có dạng YYYY-MM-DD' })
  to?: string;
}

/** Query của GET /reports/revenue. */
export class RevenueQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @IsIn(GROUP_BY)
  groupBy: GroupBy = 'DAY';
}

/** Query của GET /reports/expiring-subscriptions. */
export class ExpiringQueryDto extends PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days: number = 7;
}

/** Query của GET /reports/export. */
export class ExportQueryDto extends DateRangeQueryDto {
  @IsIn(['overview', 'revenue', 'expiring-subscriptions'])
  report: 'overview' | 'revenue' | 'expiring-subscriptions';

  @IsOptional()
  @IsIn(GROUP_BY)
  groupBy: GroupBy = 'DAY';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days: number = 7;
}
