import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { FreezeSubscriptionDto } from './dto/freeze-subscription.dto';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { SubscriptionFreezeService } from './subscription-freeze.service';
import { SubscriptionsService } from './subscriptions.service';

/** Gói hội viên: UC10 (xem gói, lịch sử gói, số buổi theo tháng), UC11 (bảo lưu, mở lại). */
@Controller('subscriptions')
@Roles('MEMBER', 'STAFF', 'ADMIN')
export class SubscriptionsController {
  constructor(
    private readonly subscriptions: SubscriptionsService,
    private readonly freezes: SubscriptionFreezeService,
  ) {}

  @Get()
  list(@Query() query: ListSubscriptionsQueryDto, @CurrentUser() user: AuthUser) {
    return this.subscriptions.list(query, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.subscriptions.get(id, user);
  }

  @Roles('STAFF', 'ADMIN')
  @HttpCode(200)
  @Post(':id/freeze')
  freeze(@Param('id') id: string, @Body() dto: FreezeSubscriptionDto, @CurrentUser() user: AuthUser) {
    return this.freezes.freeze(id, dto, user);
  }

  @Roles('STAFF', 'ADMIN')
  @HttpCode(200)
  @Post(':id/unfreeze')
  unfreeze(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.freezes.unfreeze(id, user);
  }
}
