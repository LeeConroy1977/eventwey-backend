import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAllNotifications() {
    return await this.notificationsService.findAllNotifications();
  }

  @Get(':userId')
  async getUserNotifications(@Param('userId', ParseIntPipe) userId: number) {
    return await this.notificationsService.getUserNotifications(userId);
  }

  @Patch('mark-read/:notificationId')
  async markAsRead(
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ) {
    return await this.notificationsService.markAsRead(notificationId);
  }

  @Delete('/:notificationId')
  async removeNotification(
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ) {
    return await this.notificationsService.removeNotification(notificationId);
  }
}
