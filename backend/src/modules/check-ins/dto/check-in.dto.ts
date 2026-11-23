import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { BUSINESS } from '../../../config/business.config';
import { DATE_ONLY_PATTERN, PHONE_PATTERN } from '../../members/dto/create-member.dto';

/** Body của POST /check-ins (openapi: CreateCheckInRequest). Đúng một trong hai field (kiểm ở service). */
export class CreateCheckInDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  qrToken?: string;

  @IsOptional()
  @Matches(PHONE_PATTERN, { message: 'phone phải là số Việt Nam 10 số, bắt đầu bằng 0' })
  phone?: string;
}

/** Query của GET /check-ins (openapi: listCheckIns). */
export class ListCheckInsQueryDto {
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

  /** Chỉ STAFF, ADMIN dùng; MEMBER bị bỏ qua (openapi MemberIdQuery). */
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'from phải có dạng YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'to phải có dạng YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  to?: string;

  /** Query string chỉ nhận "true"/"false"; giá trị khác giữ nguyên để IsBoolean báo lỗi. */
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  present?: boolean;
}
