import { forwardRef, Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppEvent } from '../entities/event.entity';
import { Group } from '../entities/group.entity';
import { User } from '../entities/user.entity';
import { Notification } from '../entities/notification.entity';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([AppEvent, Group, User, Notification]),
    forwardRef(() => UsersModule),
    forwardRef(() => GroupsModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => StripeModule),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
