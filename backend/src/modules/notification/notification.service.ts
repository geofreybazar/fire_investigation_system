import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UUID } from 'crypto';

import { NotificationRepository } from './notification.repository.js';
import { NotificationInput } from './schema/notification.schema.js';
import { CurrentUserJwtPayload } from '../../types/jwt.payload.js';

const INBOX_PAGE_SIZE = 10;

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  private readonly logger = new Logger();

  async getUserNotificationSettings(
    userId: UUID,
    currentUser: CurrentUserJwtPayload,
  ) {
    this.assertOwnSettings(userId, currentUser);

    const notification =
      await this.notificationRepository.getUserNotificationSettings(userId);

    if (!notification) {
      throw new NotFoundException('Notification Settings not found');
    }

    return notification;
  }

  async updateNotificationSettings(
    id: string,
    updateNotificationDato: NotificationInput,
    currentUser: CurrentUserJwtPayload,
  ) {
    this.assertOwnSettings(id, currentUser);

    this.logger.log('updating user notification settings');

    // update user notification settings
    await this.notificationRepository.updateNotificationSettings(
      id,
      updateNotificationDato,
    );

    this.logger.log('Update notification settings successful');

    return;
  }

  // ----- Inbox (Q-21) -----

  async findInbox(page: number, user: CurrentUserJwtPayload) {
    const skip = (page - 1) * INBOX_PAGE_SIZE;
    const { notifications, total } =
      await this.notificationRepository.findInbox(
        user.sub,
        skip,
        INBOX_PAGE_SIZE,
      );

    return {
      data: notifications,
      pagination: {
        page,
        limit: INBOX_PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / INBOX_PAGE_SIZE),
      },
    };
  }

  async countUnread(user: CurrentUserJwtPayload) {
    return { unread: await this.notificationRepository.countUnread(user.sub) };
  }

  async markRead(id: string, user: CurrentUserJwtPayload) {
    const updated = await this.notificationRepository.markRead(id, user.sub);

    // Already read is fine; someone else's or missing is a 404.
    if (
      updated === 0 &&
      !(await this.notificationRepository.exists(id, user.sub))
    ) {
      throw new NotFoundException('Notification not found.');
    }

    return { message: 'Notification marked as read.' };
  }

  async markAllRead(user: CurrentUserJwtPayload) {
    const updated = await this.notificationRepository.markAllRead(user.sub);

    return { updated };
  }

  // Users may only read or change their own notification preferences.
  private assertOwnSettings(
    userId: string,
    currentUser: CurrentUserJwtPayload,
  ) {
    if (userId !== currentUser.sub) {
      throw new ForbiddenException(
        'You can only access your own notification settings.',
      );
    }
  }
}
