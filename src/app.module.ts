import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConnectionsModule } from './connections/connections.module';
import { MessagesModule } from './messages/messages.module';
import { EventsModule } from './events/events.module';
import { GroupsModule } from './groups/groups.module';
import { CommentsModule } from './comments/comments.module';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { AppEvent } from './entities/event.entity';
import { Connection } from './entities/connection.entity';
import { Notification } from './entities/notification.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { Message } from './entities/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const env = process.env.NODE_ENV || 'development';

        if (env === 'test') {
          return {
            type: 'sqlite',
            database: ':memory:',
            synchronize: true,
            entities: [
              User,
              Group,
              AppEvent,
              Connection,
              Notification,
              Comment,
              Like,
              Message,
            ],
          };
        }

        if (env === 'development') {
          return {
            type: 'sqlite',
            database: join(__dirname, '..', 'db.sqlite'),
            synchronize: true,
            logging: true,
            entities: [
              User,
              Group,
              AppEvent,
              Connection,
              Notification,
              Comment,
              Like,
              Message,
            ],
          };
        }

        // Production (Render)
        return {
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL'),
          synchronize: true,
          logging: false,
          ssl: {
            rejectUnauthorized: false,
          },
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
          entities: [
            User,
            Group,
            AppEvent,
            Connection,
            Notification,
            Comment,
            Like,
            Message,
          ],
        };
      },
    }),
    UsersModule,
    AuthModule,
    NotificationsModule,
    ConnectionsModule,
    MessagesModule,
    EventsModule,
    GroupsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
