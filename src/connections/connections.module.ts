import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { Connection } from 'src/entities/connection.entity';
import { User } from 'src/entities/user.entity';
import { AppEvent } from 'src/entities/event.entity';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { Notification } from 'src/entities/notification.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';

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
