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
} from 'class-validator';
import { DurationUnit, PackageType } from '@prisma/client';

/** Body của POST /packages (openapi: CreatePackageRequest). */
export class CreatePackageDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsEnum(PackageType)
  type: PackageType;

  @IsInt()
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  durationValue: number;

  @IsEnum(DurationUnit)
  durationUnit: DurationUnit;

  /** Bắt buộc với PT, phải để trống với GYM (service kiểm). */
  @IsOptional()
  @IsInt()
  @Min(1)
  totalSessions?: number | null;

  /** Bắt buộc với PT, phải để trống với GYM (service kiểm). */
  @IsOptional()
  @IsInt()
  @Min(15)
  sessionMinutes?: number | null;

  @IsBoolean()
  includesClass: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  benefits?: string[];
}
