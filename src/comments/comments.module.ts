import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { User } from '../entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { Group } from '../entities/group.entity';
import { GroupsModule } from '../groups/groups.module';
import { UsersModule } from '../users/users.module';
import { AppEvent } from '../entities/event.entity';
import { Like } from '../entities/like.entity';
import { Notification } from '../entities/notification.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comment,
      User,
      Group,
      AppEvent,
      Like,
      Notification,
    ]),
    GroupsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
