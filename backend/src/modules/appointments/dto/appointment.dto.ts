import { AppointmentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { PageQueryDto } from '../../../common/pagination.dto';
import { DATE_ONLY_PATTERN } from '../../members/dto/create-member.dto';

/** Body của POST /appointments (openapi: CreateAppointmentRequest). */
export class CreateAppointmentDto {
  @IsUUID()
  subscriptionId: string;

  @IsUUID()
  trainerId: string;

  @IsISO8601({ strict: true })
  startsAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}

/** Body của POST /appointments/{id}/proposals (openapi: CreateProposalRequest). */
export class CreateProposalDto {
  @IsIn(['COUNTER', 'RESCHEDULE', 'CANCEL'])
  kind: 'COUNTER' | 'RESCHEDULE' | 'CANCEL';

  @IsOptional()
  @IsISO8601({ strict: true })
  startsAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;

  @IsInt()
  @Min(1)
  expectedVersion: number;
}

/** Body của POST /appointments/{id}/accept (openapi: VersionedActionRequest). */
export class VersionedActionDto {
  @IsInt()
  @Min(1)
  expectedVersion: number;
}

/** Body của POST /appointments/{id}/reject (openapi: RejectProposalRequest). */
export class RejectProposalDto extends VersionedActionDto {
  @IsString()
  @Length(1, 500)
  reason: string;
}

/** Body của POST /appointments/{id}/complete (openapi: CompleteAppointmentRequest). */
export class CompleteAppointmentDto extends VersionedActionDto {
  @IsIn(['COMPLETED', 'NO_SHOW'])
  result: 'COMPLETED' | 'NO_SHOW';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}

/** Query của GET /appointments. Lọc nhiều trạng thái: `status=PENDING&status=CONFIRMED`. */
export class ListAppointmentsQueryDto extends PageQueryDto {
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'from phải có dạng YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'to phải có dạng YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  to?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(AppointmentStatus, { each: true })
  status?: AppointmentStatus[];

  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @IsUUID()
  trainerId?: string;
}
