import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { UUID } from 'crypto';
import { NotificationInput } from './schema/notification.schema.js';
import { Prisma } from '../../generated/prisma/client.js';
import type {
  NotificationPreferenceKey,
  NotificationRecipients,
} from './notification.dispatcher.js';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserNotificationSettings(userId: UUID) {
    return this.prismaService.notificationPreference.findUnique({
      where: {
        userId,
      },
    });
  }

  async updateNotificationSettings(
    id: string,
    updateNotificationDato: NotificationInput,
  ) {
    return this.prismaService.notificationPreference.update({
      data: {
        investigationUpdates: updateNotificationDato.investigationUpdates,
        reportReview: updateNotificationDato.reportReview,
        systemAnnouncements: updateNotificationDato.systemAnnouncements,
      },
      where: {
        userId: id,
      },
    });
  }

  // Active recipients who haven't turned the preference off. Users without a
  // preference row get the defaults, which are all on.
  async findRecipientIds(
    recipients: NotificationRecipients,
    preference: NotificationPreferenceKey,
  ) {
    const who: Prisma.UserWhereInput =
      'userIds' in recipients
        ? { id: { in: recipients.userIds } }
        : { officeId: recipients.officeId, role: { in: recipients.roles } };

    const users = await this.prismaService.user.findMany({
      where: {
        ...who,
        isActive: true,
        OR: [
          { notification: { is: null } },
          { notification: { is: { [preference]: true } } },
        ],
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  async createNotifications(data: Prisma.NotificationCreateManyInput[]) {
    return this.prismaService.notification.createMany({ data });
  }

  async findInbox(userId: string, skip: number, take: number) {
    const where: Prisma.NotificationWhereInput = { userId };

    const [notifications, total] = await Promise.all([
      this.prismaService.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prismaService.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async countUnread(userId: string) {
    return this.prismaService.notification.count({
      where: { userId, readAt: null },
    });
  }

  // Scoped to the owner, so a user can't mark someone else's notification.
  async markRead(id: string, userId: string) {
    const { count } = await this.prismaService.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });

    return count;
  }

  async markAllRead(userId: string) {
    const { count } = await this.prismaService.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return count;
  }

  async exists(id: string, userId: string) {
    const count = await this.prismaService.notification.count({
      where: { id, userId },
    });

    return count > 0;
  }
}
