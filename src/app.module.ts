import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConnectionsModule } from './connections/connections.module';
import { MessagesModule } from './messages/messages.module';
import { EventsModule } from './events/events.module';
import { EventCommentsModule } from './event-comments/event-comments.module';
import { GroupsModule } from './groups/groups.module';
import { GroupCommentsModule } from './group-comments/group-comments.module';

@Module({
  imports: [UsersModule, AuthModule, NotificationsModule, ConnectionsModule, MessagesModule, EventsModule, EventCommentsModule, GroupsModule, GroupCommentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
