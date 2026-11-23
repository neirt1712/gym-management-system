import { IsInt, IsString, Length, Max, Min } from 'class-validator';
import { BUSINESS } from '../../../config/business.config';

/** Body của POST /subscriptions/{id}/freeze (openapi: FreezeSubscriptionRequest). */
export class FreezeSubscriptionDto {
  @IsInt()
  @Min(1)
  @Max(BUSINESS.freeze.maxDays)
  days: number;

  @IsString()
  @Length(1, 500)
  reason: string;
}
