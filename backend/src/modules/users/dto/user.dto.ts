import { Role, UserStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
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
import { DATE_ONLY_PATTERN, PHONE_PATTERN } from '../../members/dto/create-member.dto';

const PHONE_MESSAGE = 'phone phải là số Việt Nam 10 số, bắt đầu bằng 0';
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Query của GET /users. */
export class ListUsersQueryDto extends PageQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

/** Hồ sơ PT gửi kèm khi tạo tài khoản TRAINER. */
export class TrainerProfileDto {
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
}

/** Body của POST /users (openapi: CreateUserRequest). */
export class CreateUserDto {
  @IsIn(['STAFF', 'TRAINER'])
  role: 'STAFF' | 'TRAINER';

  @IsString()
  @Length(1, 100)
  fullName: string;

  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'dob phải có dạng YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  dob?: string | null;

  @IsString()
  @Length(8, 72)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  shift?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainerProfileDto)
  trainer?: TrainerProfileDto;
}

/** Body của PATCH /users/{id} (openapi: UpdateUserRequest). */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  fullName?: string;

  @IsOptional()
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'dob phải có dạng YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  dob?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  shift?: string | null;
}

/** Body của PATCH /users/{id}/status. */
export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsString()
  @Length(1, 500)
  reason: string;
}

/** Body của PATCH /users/{id}/role. */
export class UpdateUserRoleDto {
  @IsIn(['ADMIN', 'STAFF', 'TRAINER'])
  role: 'ADMIN' | 'STAFF' | 'TRAINER';

  @IsString()
  @Length(1, 500)
  reason: string;
}
