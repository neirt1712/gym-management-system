import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { BroadcastService } from './broadcast.service';
import { BroadcastDto } from './dto/broadcast.dto';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

/** Thông báo: UC42 (của tôi, mọi vai trò, chỉ thấy của mình), UC43 (Admin gửi chủ động). */
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly broadcasts: BroadcastService,
  ) {}

  @Get()
  list(@Query() query: ListNotificationsQueryDto, @CurrentUser() user: AuthUser) {
    return this.notifications.list(query, user);
  }

  @Roles('ADMIN')
  @HttpCode(202)
  @Post('broadcast')
  broadcast(@Body() dto: BroadcastDto) {
    return this.broadcasts.send(dto);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notifications.markRead(id, user);
  }
}
