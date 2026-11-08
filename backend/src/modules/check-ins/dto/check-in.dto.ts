import { Transform } from 'class-transformer';
import { IsBoolean, IsISO8601, IsOptional, IsString, IsUUID, Matches, MinLength } from 'class-validator';
import { PageQueryDto } from '../../../common/pagination.dto';
import { DATE_ONLY_PATTERN, PHONE_PATTERN } from '../../members/dto/create-member.dto';

/** Body của POST /check-ins: gửi đúng một trong `qrToken` hoặc `phone` (kiểm ở service). */
export class CreateCheckInDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  qrToken?: string;

  @IsOptional()
  @Matches(PHONE_PATTERN, { message: 'phone phải là số Việt Nam 10 số, bắt đầu bằng 0' })
  phone?: string;
}

/** Query của GET /check-ins. */
export class ListCheckInsQueryDto extends PageQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  present?: boolean;

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
}
