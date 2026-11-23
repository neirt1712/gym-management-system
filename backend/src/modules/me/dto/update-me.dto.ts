import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
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
import { DATE_ONLY_PATTERN } from '../../members/dto/create-member.dto';

/** Nhóm field riêng của PT trong UpdateMeRequest. */
export class UpdateMyTrainerDto {
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

/** Body của PATCH /me (openapi: UpdateMeRequest). Chỉ gửi field muốn đổi; `null` để xóa. */
export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  fullName?: string;

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
  avatarUrl?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateMyTrainerDto)
  trainer?: UpdateMyTrainerDto;
}
