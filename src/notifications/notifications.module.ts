import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from 'src/entities/notification.entity';
import { User } from 'src/entities/user.entity';
import { Group } from 'src/entities/group.entity';
import { Connection } from 'src/entities/connection.entity';
import { AppEvent } from 'src/entities/event.entity';
import { EventsModule } from 'src/events/events.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, AppEvent, Group, Connection]),
    forwardRef(() => UsersModule),
    forwardRef(() => EventsModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
