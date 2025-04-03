import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { Connection } from '../entities/connection.entity';
import { User } from '../entities/user.entity';
import { AppEvent } from '../entities/event.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Notification } from '../entities/notification.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Connection, User, Notification, AppEvent]),
    NotificationsModule,
    UsersModule,
  ],
  controllers: [ConnectionsController],
  providers: [ConnectionsService, NotificationsGateway],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
