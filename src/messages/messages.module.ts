import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/entities/message.entity';
import { Connection } from 'src/entities/connection.entity';
import { User } from 'src/entities/user.entity';
import { MessagesGateway } from './messages.gateway';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Connection, User]),  NotificationsModule, UsersModule],
  controllers: [MessagesController],
  providers: [MessagesGateway,MessagesService]
})
export class MessagesModule {}
