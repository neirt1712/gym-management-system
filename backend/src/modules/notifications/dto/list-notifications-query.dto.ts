import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PageQueryDto } from '../../../common/pagination.dto';

/** Query của GET /notifications. `isRead=false` chỉ lấy thông báo chưa đọc. */
export class ListNotificationsQueryDto extends PageQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isRead?: boolean;
}
