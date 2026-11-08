import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { BUSINESS } from '../../../config/business.config';
import { DATE_ONLY_PATTERN } from '../../members/dto/create-member.dto';

const TRAINER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
type TrainerStatusValue = (typeof TRAINER_STATUSES)[number];

/** Không gửi thì bỏ qua, gửi `null` thì vẫn kiểm (và báo lỗi). */
const NotNullIfSent = () => ValidateIf((_object, value) => value !== undefined);

/** openapi DateTime: ISO 8601 có múi giờ (+07:00 hoặc Z). */
const DATE_TIME_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

class PageQueryDto {
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

/** Query của GET /trainers (openapi: listTrainers). */
export class ListTrainersQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  specialty?: string;

  /** Chỉ Admin dùng được; vai trò khác bị bỏ qua (chỉ thấy ACTIVE). */
  @IsOptional()
  @IsIn(TRAINER_STATUSES)
  status?: TrainerStatusValue;
}

/** Body của PATCH /trainers/{id} (openapi: UpdateTrainerRequest). */
export class UpdateTrainerDto {
  /** Lưu ở users.full_name. */
  @NotNullIfSent()
  @IsString()
  @Length(1, 100)
  fullName?: string;

  @NotNullIfSent()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  specialties?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  experienceYears?: number | null;

  @NotNullIfSent()
  @IsIn(TRAINER_STATUSES)
  status?: TrainerStatusValue;
}

/** Query của GET /trainers/{id}/availability. */
export class AvailabilityQueryDto {
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'from phải có dạng YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'to phải có dạng YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  to?: string;
}

export class TimeRangeDto {
  @Matches(DATE_TIME_WITH_OFFSET, { message: 'startsAt phải là ISO 8601 có múi giờ' })
  @IsISO8601({ strict: true })
  startsAt: string;

  @Matches(DATE_TIME_WITH_OFFSET, { message: 'endsAt phải là ISO 8601 có múi giờ' })
  @IsISO8601({ strict: true })
  endsAt: string;
}

/** Body của PUT /trainers/{id}/availability (openapi: ReplaceAvailabilityRequest). */
export class ReplaceAvailabilityDto {
  @Matches(DATE_ONLY_PATTERN, { message: 'from phải có dạng YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  from: string;

  @Matches(DATE_ONLY_PATTERN, { message: 'to phải có dạng YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  to: string;

  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  slots: TimeRangeDto[];
}

/** Query của GET /trainers/{id}/members (openapi: listTrainerMembers). */
export class ListTrainerMembersQueryDto extends PageQueryDto {
  /** Tên (không dấu), SĐT hoặc mã hội viên. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
