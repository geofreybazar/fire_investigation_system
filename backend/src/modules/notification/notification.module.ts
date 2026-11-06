import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { NotificationController } from './notification.controller.js';
import { NotificationRepository } from './notification.repository.js';
import { NotificationDispatcher } from './notification.dispatcher.js';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationDispatcher,
  ],
  // Feature modules use the dispatcher to send workflow notifications.
  exports: [NotificationDispatcher],
})
export class NotificationModule {}
