import { forwardRef, Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppEvent } from 'src/entities/event.entity';
import { Group } from 'src/entities/group.entity';
import { User } from 'src/entities/user.entity';
import { Notification } from 'src/entities/notification.entity';
import { UsersModule } from 'src/users/users.module';
import { GroupsModule } from 'src/groups/groups.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppEvent, Group, User, Notification]), // Register entities for the Events module
    forwardRef(() => UsersModule), // Forward ref to avoid circular dependency with UsersModule
    forwardRef(() => GroupsModule), // Forward ref to avoid circular dependency with GroupsModule
    forwardRef(() => NotificationsModule),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService], // Export EventsService to make it available in other modules
})
export class EventsModule {}
