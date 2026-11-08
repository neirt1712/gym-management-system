import { IsEmail, IsISO8601, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

/** openapi Phone: số Việt Nam 10 số, bắt đầu bằng 0. */
export const PHONE_PATTERN = /^0[0-9]{9}$/;
/** openapi DateOnly: YYYY-MM-DD. */
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Body của POST /members (openapi: CreateMemberRequest). Tạo tài khoản MEMBER chưa có mật khẩu. */
export class CreateMemberDto {
  @IsString()
  @Length(1, 100)
  fullName: string;

  @Matches(PHONE_PATTERN, { message: 'phone phải là số Việt Nam 10 số, bắt đầu bằng 0' })
  phone: string;

  /** Không bắt buộc (Q15). */
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'dob phải có dạng YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  dob?: string | null;
}
