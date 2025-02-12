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
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { AppEvent } from './entities/event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>(
          'DB_NAME',
          join(__dirname, '..', 'db.sqlite'),
        ),
        synchronize: true,
        entities: [User, Group, AppEvent],
      }),
    }),
    UsersModule,
    AuthModule,
    NotificationsModule,
    ConnectionsModule,
    MessagesModule,
    EventsModule,
    EventCommentsModule,
    GroupsModule,
    GroupCommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
