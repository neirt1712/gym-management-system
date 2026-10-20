import {
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DATE_ONLY_PATTERN, PHONE_PATTERN } from './create-member.dto';

/** Không gửi thì bỏ qua, gửi `null` thì vẫn kiểm (và báo lỗi). Chỉ `email`, `dob` được gửi `null`. */
const NotNullIfSent = () => ValidateIf((_object, value) => value !== undefined);

/** Body của PATCH /members/{id} (openapi: UpdateMemberRequest). Đổi SĐT thì SĐT mới là định danh đăng nhập. */
export class UpdateMemberDto {
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
}
