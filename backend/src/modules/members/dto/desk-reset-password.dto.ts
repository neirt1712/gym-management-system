import { IsString, Length } from 'class-validator';

/** Body của POST /members/{id}/reset-password (openapi: DeskResetPasswordRequest). Khách tự gõ trên máy quầy. */
export class DeskResetPasswordDto {
  @IsString()
  @Length(8, 72)
  newPassword: string;
}
