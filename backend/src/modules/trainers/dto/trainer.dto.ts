import { TrainerStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PageQueryDto } from '../../../common/pagination.dto';
import { DATE_ONLY_PATTERN } from '../../members/dto/create-member.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Query của GET /trainers. */
export class ListTrainersQueryDto extends PageQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  specialty?: string;

  /** Chỉ Admin dùng được. */
  @IsOptional()
  @IsEnum(TrainerStatus)
  status?: TrainerStatus;
}

/** Body của PATCH /trainers/{id} (openapi: UpdateTrainerRequest). */
export class UpdateTrainerDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  fullName?: string;

  @IsOptional()
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

  @IsOptional()
  @IsEnum(TrainerStatus)
  status?: TrainerStatus;
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

/** openapi TimeRange. */
export class TimeRangeDto {
  @IsISO8601({ strict: true })
  startsAt: string;

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

/** Query của GET /trainers/{id}/members. */
export class TrainerMembersQueryDto extends PageQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;
}
