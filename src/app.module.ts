import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConnectionsModule } from './connections/connections.module';
import { MessagesModule } from './messages/messages.module';
import { EventsModule } from './events/events.module';
import { GroupsModule } from './groups/groups.module';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { AppEvent } from './entities/event.entity';
import { Connection } from './entities/connection.entity';
import { Notification } from './entities/notification.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { Message } from './entities/message.entity';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`, 
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const isTestEnv = process.env.NODE_ENV === 'test';
        const isDevEnv = process.env.NODE_ENV === 'development';
        const isProdEnv = process.env.NODE_ENV === 'production';

        let dbConfig: TypeOrmModuleOptions = {
          type: 'postgres', 
          host: configService.get<string>('DATABASE_HOST', 'localhost'),
          port: configService.get<number>('DATABASE_PORT', 5432),
          username: configService.get<string>('DATABASE_USER', 'postgres'),
          password: configService.get<string>('DATABASE_PASSWORD', 'password'),
          database: configService.get<string>('DATABASE_NAME', 'eventwey'),
          synchronize: true,
          logging: isDevEnv,
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

  
        if (isTestEnv) {
          dbConfig = {
            ...dbConfig,
            database: 'eventwey_test', 
            logging: false,
          };
        }


        if (isDevEnv) {
          dbConfig = {
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

        if (isProdEnv) {
          dbConfig = {
            ...dbConfig,
            synchronize: false, 
            logging: false, 
          };
        }

        return dbConfig;
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
