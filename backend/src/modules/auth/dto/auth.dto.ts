import {
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DATE_ONLY_PATTERN, PHONE_PATTERN } from '../../members/dto/create-member.dto';

const PHONE_MESSAGE = 'phone phải là số Việt Nam 10 số, bắt đầu bằng 0';

/** Body của POST /auth/register (openapi: RegisterRequest). */
export class RegisterDto {
  @IsString()
  @Length(1, 100)
  fullName: string;

  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
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

  @IsString()
  @Length(8, 72)
  password: string;
}

/** Body của POST /auth/login (openapi: LoginRequest). Không kiểm độ dài, chỉ so với mật khẩu đã lưu. */
export class LoginDto {
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone: string;

  @IsString()
  @MinLength(1)
  password: string;
}

/** Body của POST /auth/change-password (openapi: ChangePasswordRequest). */
export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @Length(8, 72)
  newPassword: string;
}
