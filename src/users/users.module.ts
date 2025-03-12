import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { GroupsModule } from 'src/groups/groups.module';
import { AppEvent } from 'src/entities/event.entity';
import { EventsModule } from 'src/events/events.module';
import { Notification } from 'src/entities/notification.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { Comment } from 'src/entities/comment.entity';
import { GroupsService } from 'src/groups/groups.service';
import { EventsService } from 'src/events/events.service';
import { Group } from 'src/entities/group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Group, AppEvent, Notification,Comment ]), 
    forwardRef(() => AuthModule), 
    forwardRef(() => EventsModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => GroupsModule),
    
  ],
  controllers: [UsersController],
  providers: [UsersService, GroupsService, EventsService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
