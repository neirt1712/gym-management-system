import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PageQueryDto } from '../../../common/pagination.dto';

/** openapi Exercise. */
export class ExerciseDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sets?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  reps?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string | null;
}

/** Query của GET /members/{id}/training-notes. */
export class ListTrainingNotesQueryDto extends PageQueryDto {
  @IsOptional()
  @IsUUID()
  planId?: string;
}

/** Body của POST /members/{id}/training-notes (openapi: CreateTrainingNoteRequest). */
export class CreateTrainingNoteDto {
  @IsString()
  @Length(1, 2000)
  content: string;

  @IsOptional()
  @IsUUID()
  planId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number | null;
}

/** Body của POST /members/{id}/training-plans (openapi: CreateTrainingPlanRequest). */
export class CreateTrainingPlanDto {
  @IsString()
  @Length(1, 200)
  title: string;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;
}

/** Body của PATCH /training-plans/{id} (openapi: UpdateTrainingPlanRequest). Gửi exercises là thay cả danh sách. */
export class UpdateTrainingPlanDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises?: ExerciseDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;
}
