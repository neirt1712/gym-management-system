import { Body, Controller, Get, HttpCode, Ip, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Public, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { ConfirmCashDto, CreatePaymentDto, ListPaymentsQueryDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

/** Thanh toán: UC12 (VNPay), UC13 (tiền mặt), UC14 (lịch sử). */
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Roles('MEMBER', 'STAFF', 'ADMIN')
  @Post('orders/:id/payments')
  create(
    @Param('id') orderId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
  ) {
    return this.payments.create(orderId, dto.method, user, ip);
  }

  @Roles('MEMBER', 'STAFF', 'ADMIN')
  @Get('payments')
  list(@Query() query: ListPaymentsQueryDto, @CurrentUser() user: AuthUser) {
    return this.payments.list(query, user);
  }

  /** Chỉ VNPay gọi; tham số vnp_* không theo DTO nên đọc thẳng từ query thô. */
  @Public()
  @Get('payments/vnpay/ipn')
  ipn(@Query() params: Record<string, string>) {
    return this.payments.handleIpn(params);
  }

  @Roles('MEMBER', 'STAFF', 'ADMIN')
  @Get('payments/:id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.payments.get(id, user);
  }

  @Roles('STAFF', 'ADMIN')
  @HttpCode(200)
  @Post('payments/:id/confirm-cash')
  confirmCash(@Param('id') id: string, @Body() dto: ConfirmCashDto, @CurrentUser() user: AuthUser) {
    return this.payments.confirmCash(id, dto, user);
  }
}
