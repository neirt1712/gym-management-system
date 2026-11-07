import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { SubscriptionsService } from './subscriptions.service';

/** Gói hội viên: UC10 (xem gói của tôi, lịch sử gói, số buổi theo tháng). */
@Controller('subscriptions')
@Roles('MEMBER', 'STAFF', 'ADMIN')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get()
  list(@Query() query: ListSubscriptionsQueryDto, @CurrentUser() user: AuthUser) {
    return this.subscriptions.list(query, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.subscriptions.get(id, user);
  }
}
