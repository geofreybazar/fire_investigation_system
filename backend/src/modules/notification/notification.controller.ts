import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { type UUID } from 'crypto';
import {
  inboxQuerySchema,
  notificationSchema,
  type InboxQuery,
  type NotificationInput,
} from './schema/notification.schema.js';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // The inbox routes come before ':id', which is the settings route.

  @UseGuards(AuthGuard)
  @Get('inbox')
  async findInbox(
    @Query({ schema: inboxQuerySchema }) query: InboxQuery,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.notificationService.findInbox(query.page, user);
  }

  @UseGuards(AuthGuard)
  @Get('unread-count')
  async countUnread(@CurrentUser() user: CurrentUserJwtPayload) {
    return this.notificationService.countUnread(user);
  }

  @UseGuards(AuthGuard)
  @Post('read-all')
  async markAllRead(@CurrentUser() user: CurrentUserJwtPayload) {
    return this.notificationService.markAllRead(user);
  }

  @UseGuards(AuthGuard)
  @Post(':id/read')
  async markRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.notificationService.markRead(id, user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserNotificationSettings(
    @Param('id', new ParseUUIDPipe()) id: UUID,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return await this.notificationService.getUserNotificationSettings(id, user);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async updateNotificationSettings(
    @Param('id', new ParseUUIDPipe()) id: UUID,
    @Body({ schema: notificationSchema })
    updateNotificationDto: NotificationInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return await this.notificationService.updateNotificationSettings(
      id,
      updateNotificationDto,
      user,
    );
  }
}
