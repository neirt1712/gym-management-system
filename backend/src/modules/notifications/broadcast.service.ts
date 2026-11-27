import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { BroadcastDto } from './dto/broadcast.dto';

/** UC43 · Quyết định 2: thông báo chủ động chỉ trong ứng dụng. Người nhận theo vai trò, tài khoản ACTIVE (Q20g). */
@Injectable()
export class BroadcastService {
  constructor(private readonly prisma: PrismaService) {}

  async send(dto: BroadcastDto): Promise<{ recipientCount: number }> {
    const recipients = await this.prisma.user.findMany({
      where: { status: 'ACTIVE', role: { in: dto.roles } },
      select: { id: true },
    });
    if (recipients.length === 0) return { recipientCount: 0 };
    const { count } = await this.prisma.notification.createMany({
      data: recipients.map((u) => ({ userId: u.id, type: 'BROADCAST', title: dto.title, body: dto.body })),
    });
    return { recipientCount: count };
  }
}
