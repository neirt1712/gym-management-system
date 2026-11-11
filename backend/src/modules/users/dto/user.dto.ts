import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
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
import { ROLES, type Role } from '../../../common/auth/role';
import { DATE_ONLY_PATTERN, PHONE_PATTERN } from '../../members/dto/create-member.dto';

/** Không gửi thì bỏ qua, gửi `null` thì vẫn kiểm (và báo lỗi). */
const NotNullIfSent = () => ValidateIf((_object, value) => value !== undefined);

const USER_STATUSES = ['ACTIVE', 'LOCKED'] as const;
type UserStatusValue = (typeof USER_STATUSES)[number];

/** Query của GET /users (openapi: listUsers). */
export class ListUsersQueryDto {
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

  /** Tên (không dấu), SĐT hoặc email. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(ROLES)
  role?: Role;

  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: UserStatusValue;
}

/** Hồ sơ PT gửi kèm POST /users khi role = TRAINER. */
export class TrainerProfileInputDto {
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

  @Matches(PHONE_PATTERN, { message: 'phone phải là số Việt Nam 10 số, bắt đầu bằng 0' })
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

  /** Bắt buộc khi role = TRAINER (kiểm ở service để báo đúng field). */
  @IsOptional()
  @ValidateNested()
  @Type(() => TrainerProfileInputDto)
  trainer?: TrainerProfileInputDto;
}

/** Body của PATCH /users/{id} (openapi: UpdateUserRequest). */
export class UpdateUserDto {
  @NotNullIfSent()
  @IsString()
  @Length(1, 100)
  fullName?: string;

  @NotNullIfSent()
  @Matches(PHONE_PATTERN, { message: 'phone phải là số Việt Nam 10 số, bắt đầu bằng 0' })
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

/** Body của PATCH /users/{id}/status (openapi: UpdateUserStatusRequest). */
export class UpdateUserStatusDto {
  @IsIn(USER_STATUSES)
  status: UserStatusValue;

  @IsString()
  @Length(1, 500)
  reason: string;
}

/** Body của PATCH /users/{id}/role (openapi: UpdateUserRoleRequest). */
export class UpdateUserRoleDto {
  /** openapi chỉ cho ADMIN, STAFF, TRAINER; gửi MEMBER thì service trả 422 ROLE_CHANGE_NOT_ALLOWED như openapi ghi. */
  @IsIn(ROLES)
  role: Role;

  @IsString()
  @Length(1, 500)
  reason: string;
}
