import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { DurationUnit, PackageStatus } from '@prisma/client';

/**
 * Không gửi thì bỏ qua, gửi `null` thì vẫn kiểm (và báo lỗi).
 * `@IsOptional()` bỏ qua cả `null`, chỉ dùng cho field openapi cho phép null.
 */
const NotNullIfSent = () => ValidateIf((_object, value) => value !== undefined);

/**
 * Body của PATCH /packages/{id} (openapi: UpdatePackageRequest).
 * Mọi field không bắt buộc; không có `type` (gửi `type` thì VALIDATION_ERROR); thêm `status` để ngừng bán, bán lại.
 * Chỉ `description`, `totalSessions`, `sessionMinutes` được gửi `null`.
 */
export class UpdatePackageDto {
  @NotNullIfSent()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @NotNullIfSent()
  @IsInt()
  @Min(0)
  price?: number;

  @NotNullIfSent()
  @IsInt()
  @Min(1)
  durationValue?: number;

  @NotNullIfSent()
  @IsEnum(DurationUnit)
  durationUnit?: DurationUnit;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalSessions?: number | null;

  @IsOptional()
  @IsInt()
  @Min(15)
  sessionMinutes?: number | null;

  @NotNullIfSent()
  @IsBoolean()
  includesClass?: boolean;

  @NotNullIfSent()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  benefits?: string[];

  @NotNullIfSent()
  @IsEnum(PackageStatus)
  status?: PackageStatus;
}
