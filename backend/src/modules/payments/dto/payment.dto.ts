import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { DateRangePageQueryDto } from '../../orders/dto/order.dto';

/** Body của POST /orders/{id}/payments (openapi: CreatePaymentRequest). */
export class CreatePaymentDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

/** Body của POST /payments/{id}/confirm-cash (openapi: ConfirmCashRequest). */
export class ConfirmCashDto {
  @IsInt()
  @Min(0)
  receivedAmount: number;
}

/** Query của GET /payments. */
export class ListPaymentsQueryDto extends DateRangePageQueryDto {
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}
