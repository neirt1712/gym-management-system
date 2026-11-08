import { Injectable } from '@nestjs/common';
import type { Notification, Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { pageMeta } from '../../common/notify';
import { PrismaService } from '../../prisma/prisma.service';
import { toVnDateTime } from '../members/member.response';
import type { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

/** openapi Notification. */
const toNotificationResponse = (n: Notification) => ({
  id: n.id,
  type: n.type,
  title: n.title,
  body: n.body,
  targetType: n.targetType,
  targetId: n.targetId,
  isRead: n.isRead,
  createdAt: toVnDateTime(n.createdAt),
});

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** UC42. Chỉ thông báo của mình; `meta.unreadCount` không phụ thuộc bộ lọc. Mới nhất trước. */
  async list(query: ListNotificationsQueryDto, user: AuthUser) {
    const where: Prisma.NotificationWhereInput = { userId: user.id, isRead: query.isRead };
    const { page, pageSize } = query;
    const [total, unreadCount, rows] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId: user.id, isRead: false } }),
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      data: rows.map(toNotificationResponse),
      meta: { ...pageMeta(page, pageSize, total), unreadCount },
    };
  }

  /** UC42. Thông báo của người khác thì 404; gửi lặp trả thông báo hiện tại. */
  async markRead(id: string, user: AuthUser) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== user.id) throw new AppError('NOT_FOUND');
    if (notification.isRead) return toNotificationResponse(notification);
    return toNotificationResponse(
      await this.prisma.notification.update({ where: { id }, data: { isRead: true } }),
    );
  }
}
