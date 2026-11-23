import { ClassStatus, EnrollmentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PageQueryDto } from '../../../common/pagination.dto';
import { DATE_ONLY_PATTERN } from '../../members/dto/create-member.dto';

const toBoolean = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

/** Query của GET /classes (openapi: listClasses). */
export class ListClassesQueryDto extends PageQueryDto {
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'from phải có dạng YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'to phải có dạng YYYY-MM-DD' })
  to?: string;

  @IsOptional()
  @IsUUID()
  trainerId?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  mine?: boolean;

  /** Chỉ Admin dùng được; vai trò khác bị bỏ qua. */
  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}

/** Body của POST /classes (openapi: CreateClassRequest). */
export class CreateClassDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsUUID()
  trainerId: string;

  @IsInt()
  @Min(1)
  @Max(200)
  capacity: number;

  @IsISO8601({ strict: true })
  startsAt: string;

  @IsISO8601({ strict: true })
  endsAt: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  cancelBeforeMinutes?: number;
}

/** Body của PATCH /classes/{id} (openapi: UpdateClassRequest). Chỉ gửi field muốn đổi. */
export class UpdateClassDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsUUID()
  trainerId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  capacity?: number;

  @IsOptional()
  @IsISO8601({ strict: true })
  startsAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  endsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  cancelBeforeMinutes?: number;

  /** Chỉ dùng để hủy lớp. */
  @IsOptional()
  @IsIn(['CANCELLED'])
  status?: 'CANCELLED';
}

/** Query của GET /classes/{id}/enrollments. */
export class ListEnrollmentsQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
