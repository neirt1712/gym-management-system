import { Injectable } from '@nestjs/common';
import type { Notification, Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { assertFound } from '../../common/ownership/ownership';
import { PrismaService } from '../../prisma/prisma.service';
import { toVnDateTime } from '../members/member.response';
import type { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

/** Schema `Notification` trong openapi. */
export type NotificationResponse = {
  id: string;
  type: string;
  title: string;
  body: string;
  targetType: string | null;
  targetId: string | null;
  isRead: boolean;
  createdAt: string;
};

const toNotificationResponse = (n: Notification): NotificationResponse => ({
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

  /** UC42. Mới nhất trước; meta.unreadCount là tổng chưa đọc, không phụ thuộc bộ lọc isRead. */
  async list(query: ListNotificationsQueryDto, user: AuthUser) {
    const mine: Prisma.NotificationWhereInput = { userId: user.id };
    const where: Prisma.NotificationWhereInput =
      query.isRead === undefined ? mine : { ...mine, isRead: query.isRead };
    const { page, pageSize } = query;

    const [total, unreadCount, rows] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...mine, isRead: false } }),
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      data: rows.map(toNotificationResponse),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), unreadCount },
    };
  }

  /** UC42. Chỉ thông báo của mình; của người khác thì 404 (common/ownership). Gửi lặp vẫn 200. */
  async markRead(id: string, user: AuthUser): Promise<NotificationResponse> {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const existing = await this.prisma.notification.findFirst({ where: { id, userId: user.id } });
    assertFound(existing);
    if (existing.isRead) return toNotificationResponse(existing);
    const updated = await this.prisma.notification.update({ where: { id }, data: { isRead: true } });
    return toNotificationResponse(updated);
  }
}
