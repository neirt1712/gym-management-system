import { ArrayMinSize, ArrayUnique, IsArray, IsIn, IsString, Length } from 'class-validator';
import { ROLES, type Role } from '../../../common/auth/role';

/** Body của POST /notifications/broadcast (openapi: BroadcastRequest). */
export class BroadcastDto {
  @IsString()
  @Length(1, 100)
  title: string;

  @IsString()
  @Length(1, 1000)
  body: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(ROLES, { each: true })
  roles: Role[];
}
