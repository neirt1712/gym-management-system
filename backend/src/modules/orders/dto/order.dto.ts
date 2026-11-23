import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BUSINESS } from '../../../config/business.config';
import { DATE_ONLY_PATTERN } from '../../members/dto/create-member.dto';

const DATE_MESSAGE = 'phải có dạng YYYY-MM-DD';

/** Body của POST /orders/quote và POST /orders (openapi: OrderRequest). */
export class OrderRequestDto {
  @IsUUID()
  packageId: string;

  /** Bắt buộc khi STAFF/ADMIN mua hộ; MEMBER không gửi. */
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @IsUUID()
  renewalOf?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: `startsOn ${DATE_MESSAGE}` })
  @IsISO8601({ strict: true })
  startsOn?: string;
}

/** Body của POST /orders/{id}/cancel (openapi: CancelOrderRequest). */
export class CancelOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Query của GET /orders và các cột phân trang dùng chung với GET /payments. */
export class DateRangePageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(BUSINESS.pagination.maxPageSize)
  pageSize: number = BUSINESS.pagination.defaultPageSize;

  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: `from ${DATE_MESSAGE}` })
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: `to ${DATE_MESSAGE}` })
  @IsISO8601({ strict: true })
  to?: string;
}

export class ListOrdersQueryDto extends DateRangePageQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
