import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Connection } from '../entities/connection.entity';
import { User } from '../entities/user.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { Notification } from '../entities/notification.entity';
import { AppEvent } from '../entities/event.entity';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,

    @InjectRepository(User)
    private readonly notificationRepository: Repository<Notification>,

    @InjectRepository(AppEvent)
    private readonly eventRepository: Repository<AppEvent>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private notificationsGateway: NotificationsGateway,
    private notificationsService: NotificationsService,
  ) {}

  async sendConnectionRequest(senderId: number, recipientId: number) {
    if (senderId === recipientId) {
      throw new BadRequestException("You can't connect with yourself");
    }

    const senderObj = await this.usersService.findUserById(senderId);

    const existingConnection = await this.connectionRepository.findOne({
      where: [
        { requester: { id: senderId }, recipient: { id: recipientId } },
        { requester: { id: recipientId }, recipient: { id: senderId } },
      ],
    });

    if (existingConnection) {
      throw new BadRequestException('Connection request already exists');
    }

    const connection = this.connectionRepository.create({
      requester: { id: senderId },
      recipient: { id: recipientId },
      status: 'pending',
    });

    await this.connectionRepository.save(connection);

    await this.notificationsService.createNotification(
      recipientId,
      senderId,
      'connection_request',
      `You have a new connection request from  ${senderObj.username}`,
    );

    this.notificationsGateway.sendNotification(recipientId, senderId, {
      type: 'connection_request',
      message: `You have a new connection request from ${senderObj.username}`,
    });

    return connection;
  }


  async cancelConnectionRequest(userId: number, senderId: number, recipientId: number) {
    if (userId !== senderId) {
      throw new UnauthorizedException(
        'You can only cancel your own connection requests'
      )
    }

    const connection  =  await this.connectionRepository.findOne({
      where: {
        requester: {id: senderId},
        recipient: {id: recipientId},
        status: 'pending'
      },
      relations: ['requester', 'recipient']
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found')
    }

    const notification = await this.notificationRepository.findOne({
      where: {
        user: {id: recipientId},
        senderId: senderId,
        type: 'connection_request',
      },
    });

    if (notification) {
      await this.notificationRepository.remove(notification);
      this.notificationsGateway.sendNotification(recipientId, senderId, {
        type: 'connection_request_cancelled',
        message: `Connection request from ${connection.requester.username} has been cancelled`
      })
    }

    await this.connectionRepository.remove(connection)

    return {message: 'Connection request cancelled successfully'}


  }


  async updateConnectionStatus(
    requestId: number,
    status: 'accepted' | 'rejected',
  ) {
    const connection = await this.connectionRepository.findOne({
      where: { id: requestId },
      relations: ['requester', 'recipient'],
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (status === 'accepted') {
      await this.addToConnections(
        connection.requester.id,
        connection.recipient.id,
      );
    }

    await this.notificationsService.createNotification(
      connection.requester.id,
      connection.recipient.id,
      'connection_accepted',
      `${connection.recipient.username} accepted your connection request`,
    );

    this.notificationsGateway.sendNotification(
      connection.requester.id,
      connection.recipient.id,
      {
        type: 'connection_accepted',
        message: `${connection.recipient.id} accepted your connection request`,
      },
    );

    await this.connectionRepository.remove(connection);
    return { message: `Connection request ${status}` };
  }

  async findUserRequests(userId: number) {
    const requests = await this.connectionRepository.find({
      where: {
        recipient: { id: userId },
        status: 'pending',
      },
      relations: [
        'requester',
        'requester.connections',
        'requester.events',
        'requester.groups',
        'requester.adminGroups',
      ],
      loadRelationIds: true,
    });

    return requests;
  }

  async getUserConnections(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      loadRelationIds: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.connections;
  }

  async findUserSentRequests(userId: number) {
    const requests = await this.connectionRepository.find({
      where: {
        requester: { id: userId },
        status: 'pending',
      },
      relations: [
        'recipient',
        'recipient.connections',
        'recipient.events',
        'recipient.groups',
        'recipient.adminGroups',
      ],
      loadRelationIds: true,
    });

    return requests;
  }

  async inviteToEvent(
    senderId: number,
    recipientIds: number[],
    eventId: number,
  ) {
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });
    if (!sender) throw new NotFoundException('Sender not found');

    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const recipients = await this.userRepository.find({
      where: { id: In(recipientIds) },
    });
    if (recipients.length !== recipientIds.length) {
      throw new BadRequestException('One or more recipients not found');
    }

    for (const recipient of recipients) {
      await this.notificationsService.createNotification(
        recipient.id,
        senderId,
        'event-invite',
        `${sender.username} invited you to join the event: ${event.title}`,
        event.id,
      );
    }

    return {
      message: 'Invitations sent successfully',
    };
  }

  async removeConnection(userId: number, connectionId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['connections'],
    });

    const connection = await this.userRepository.findOne({
      where: { id: connectionId },
      relations: ['connections'],
    });

    if (!user || !connection) {
      throw new NotFoundException('User or Connection not found');
    }

    user.connections = user.connections.filter(
      (conn) => conn.id !== connectionId,
    );
    connection.connections = connection.connections.filter(
      (conn) => conn.id !== userId,
    );

    await this.userRepository.save(user);
    await this.userRepository.save(connection);

    return { message: 'Connection removed successfully' };
  }

  private async addToConnections(userId1: number, userId2: number) {
    const user1 = await this.userRepository.findOne({
      where: { id: userId1 },
      relations: ['connections'],
    });
    const user2 = await this.userRepository.findOne({
      where: { id: userId2 },
      relations: ['connections'],
    });

    if (!user1 || !user2) {
      throw new NotFoundException('Users not found');
    }

    user1.connections.push(user2);
    user2.connections.push(user1);

    await this.userRepository.save(user1);
    await this.userRepository.save(user2);
  }
}
