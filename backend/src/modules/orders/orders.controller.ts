import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { CancelOrderDto, ListOrdersQueryDto, OrderRequestDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

/** Đơn hàng: UC09 (báo giá, tạo, hủy), UC14 (lịch sử, chi tiết). */
@Controller('orders')
@Roles('MEMBER', 'STAFF', 'ADMIN')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @HttpCode(200)
  @Post('quote')
  quote(@Body() dto: OrderRequestDto, @CurrentUser() user: AuthUser) {
    return this.orders.quote(dto, user);
  }

  @Post()
  create(@Body() dto: OrderRequestDto, @CurrentUser() user: AuthUser) {
    return this.orders.create(dto, user);
  }

  @Get()
  list(@Query() query: ListOrdersQueryDto, @CurrentUser() user: AuthUser) {
    return this.orders.list(query, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.get(id, user);
  }

  @HttpCode(200)
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelOrderDto, @CurrentUser() user: AuthUser) {
    return this.orders.cancel(id, dto, user);
  }
}
