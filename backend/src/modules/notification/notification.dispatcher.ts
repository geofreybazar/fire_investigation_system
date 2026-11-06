import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationEntityType,
  NotificationType,
  ROLE,
} from '../../generated/prisma/enums.js';
import { NotificationRepository } from './notification.repository.js';

// The preference that lets a user opt out of each notification type (Q-21).
export type NotificationPreferenceKey = 'investigationUpdates' | 'reportReview';

export const PREFERENCE_FOR: Record<
  NotificationType,
  NotificationPreferenceKey
> = {
  CASE_REFERRED: 'investigationUpdates',
  INVESTIGATOR_ASSIGNED: 'investigationUpdates',
  REPORT_SUBMITTED: 'reportReview',
  REPORT_APPROVED: 'reportReview',
  REPORT_REJECTED: 'reportReview',
};

// Either specific users, or the active holders of some roles in one office.
export type NotificationRecipients =
  { userIds: string[] } | { officeId: string; roles: ROLE[] };

export interface NotificationEvent {
  type: NotificationType;
  title: string;
  body: string;
  entityType: NotificationEntityType;
  entityId: string;
  // The user who caused the event never notifies themselves.
  actorId: string;
  recipients: NotificationRecipients;
}

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  // Called after the business change has committed. Best effort: a failure is
  // logged and never undoes or fails the change that caused it.
  async notify(event: NotificationEvent): Promise<void> {
    try {
      const userIds = await this.notificationRepository.findRecipientIds(
        event.recipients,
        PREFERENCE_FOR[event.type],
      );
      const recipients = userIds.filter((id) => id !== event.actorId);

      if (recipients.length === 0) {
        return;
      }

      await this.notificationRepository.createNotifications(
        recipients.map((userId) => ({
          userId,
          type: event.type,
          title: event.title,
          body: event.body,
          entityType: event.entityType,
          entityId: event.entityId,
        })),
      );
    } catch (error) {
      this.logger.error(
        `Could not send ${event.type} notification`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
