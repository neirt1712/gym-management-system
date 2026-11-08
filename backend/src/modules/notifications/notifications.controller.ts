import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

/** Thông báo của tôi: UC42. Mọi vai trò đã đăng nhập, chỉ thấy thông báo của mình. */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Query() query: ListNotificationsQueryDto, @CurrentUser() user: AuthUser) {
    return this.notifications.list(query, user);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notifications.markRead(id, user);
  }
}
