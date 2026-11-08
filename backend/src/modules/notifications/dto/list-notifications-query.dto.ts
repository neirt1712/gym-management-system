import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PageQueryDto } from '../../../common/pagination.dto';

/** Query của GET /notifications. `isRead=false` chỉ lấy thông báo chưa đọc. */
export class ListNotificationsQueryDto extends PageQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value))
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { BUSINESS } from '../../../config/business.config';

/** Query của GET /notifications (openapi: listNotifications). */
export class ListNotificationsQueryDto {
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

  /** Query string chỉ nhận "true"/"false"; giá trị khác giữ nguyên để IsBoolean báo lỗi. */
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isRead?: boolean;
}
