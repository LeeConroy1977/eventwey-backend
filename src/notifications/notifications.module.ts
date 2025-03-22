import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';
import { Connection } from '../entities/connection.entity';
import { AppEvent } from '../entities/event.entity';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { Message } from '../entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      User,
      AppEvent,
      Group,
      Connection,
      Message,
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => EventsModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
