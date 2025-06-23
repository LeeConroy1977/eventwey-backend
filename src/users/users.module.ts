import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { GroupsModule } from '../groups/groups.module';
import { AppEvent } from '../entities/event.entity';
import { EventsModule } from '../events/events.module';
import { Notification } from '../entities/notification.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Comment } from '../entities/comment.entity';
import { GroupsService } from '../groups/groups.service';
import { EventsService } from '../events/events.service';
import { Group } from '../entities/group.entity';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Group, AppEvent, Notification, Comment]),
    forwardRef(() => AuthModule),
    forwardRef(() => EventsModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => GroupsModule),
    forwardRef(() => StripeModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, GroupsService, EventsService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
