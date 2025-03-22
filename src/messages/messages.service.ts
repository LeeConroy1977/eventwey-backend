import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from '../entities/message.entity';
import { Repository } from 'typeorm';
import { CreateMessageDto } from './dtos/create-message-dto';
import { UsersService } from '../users/users.service';
import { plainToClass } from 'class-transformer';
import { MessageResponseDto } from './dtos/message-response-dto';
import { Connection } from '../entities/connection.entity';
import { User } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    private readonly userService: UsersService,
    private readonly notificationService: NotificationsService,
  ) {}

  async sendMessage(
    recipientId: number,
    userId: number,
    body: CreateMessageDto,
  ) {
    const recipient = await this.userService.findUserById(recipientId);
    const sender = await this.userService.findUserById(userId);

    const existingConnection = await this.connectionRepository
      .createQueryBuilder('connection')
      .where(
        '(connection.requester.id = :userId AND connection.recipient.id = :recipientId)',
        { userId, recipientId },
      )
      .orWhere(
        '(connection.requester.id = :recipientId AND connection.recipient.id = :userId)',
        { userId, recipientId },
      )
      .getOne();

    if (recipientId === userId)
      throw new ForbiddenException('You cannot message yourself');

    if (!existingConnection) {
      throw new BadRequestException('You are not connected to this user');
    }

    if (!recipient) throw new NotFoundException('recipient not found');
    if (!sender) throw new NotFoundException('User not found');

    const newMessage = {
      sender: sender,
      recipient: recipient,
      content: body.content,
    };
    this.messageRepository.create(newMessage);
    await this.messageRepository.save(newMessage);

    if (userId !== recipientId) {
      this.notificationService.createNotification(
        recipientId,
        userId,
        'Message',
        `${sender.username} sent you a message`,
      );
    }
    return newMessage;
  }

  async getConversation(recipientId: number, userId: number) {
    const recipient = await this.userService.findUserById(recipientId);
    if (!recipient) throw new NotFoundException('recipient not found');

    return this.messageRepository.find({
      where: [
        { sender: { id: userId }, recipient: { id: Number(recipientId) } },
        { sender: { id: Number(recipientId) }, recipient: { id: userId } },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'recipient'],
    });
  }

  async getAllMessages(userId: number) {
    const messages = this.messageRepository.find({
      where: [{ sender: { id: userId } }, { recipient: { id: userId } }],
      relations: ['sender', 'recipient'],

      order: { createdAt: 'ASC' },
    });

    return plainToClass(MessageResponseDto, messages);
  }
}
