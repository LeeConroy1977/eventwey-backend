import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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
    const recipientObj = await this.usersService.findUserById(recipientId);

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

    await this.notificationsService.createNotification(
      senderId,
      recipientId,

      'connection_request_sent',
      `You have sent a connection request to ${recipientObj.username}`,
    );

    this.notificationsGateway.sendNotification(senderId, recipientId, {
      type: 'connection_request_sent',
      message: `You have a new connection request from ${senderObj.username}`,
    });

    return connection;
  }

  async cancelConnectionRequest(
    userId: number,
    senderId: number,
    recipientId: number,
  ) {
    console.log(
      `Attempting to cancel connection request: userId=${userId}, senderId=${senderId}, recipientId=${recipientId}`,
    );
    if (userId !== senderId) {
      throw new UnauthorizedException(
        'You can only cancel your own connection requests',
      );
    }

    try {
      const connection = await this.connectionRepository.findOne({
        where: {
          requester: { id: senderId },
          recipient: { id: recipientId },
          status: 'pending',
        },
      });

      const senderObj = await this.usersService.findUserById(senderId);

      if (!connection) {
        throw new NotFoundException('Connection request not found');
      }

      await this.connectionRepository.remove(connection);
      console.log(
        `Connection deleted: requesterId=${senderId}, recipientId=${recipientId}`,
      );

      try {
        console.log(
          `Querying notification for userId=${recipientId}, senderId=${senderId}, type=connection_request`,
        );
        let notification = null;
        try {
          notification = await this.notificationRepository.findOne({
            where: {
              user: { id: recipientId },
              senderId,
              type: 'connection_request',
            },
          });
        } catch (relationError) {
          console.warn(
            'Relation query failed, trying direct userId query:',
            relationError,
          );
          notification = await this.notificationRepository
            .createQueryBuilder('notification')
            .where('notification.userId = :recipientId', { recipientId })
            .andWhere('notification.senderId = :senderId', { senderId })
            .andWhere('notification.type = :type', {
              type: 'connection_request',
            })
            .getOne();
        }

        if (notification) {
          console.log(
            `Found notification: id=${notification.id}, userId=${notification.user?.id || notification['userId']}, senderId=${notification.senderId}`,
          );
          await this.notificationRepository.remove(notification);
          try {
            console.log(
              `Sending WebSocket notification to recipientId=${recipientId}`,
            );
            this.notificationsGateway.sendNotification(recipientId, senderId, {
              type: 'connection_request_cancelled',
              message: `Connection request from ${senderObj?.username || 'user'} has been cancelled`,
            });
          } catch (wsError) {
            console.warn('WebSocket notification failed:', wsError);
          }
        } else {
          console.log('No notification found for cancellation');
        }

        const recipientObj = await this.usersService.findUserById(recipientId);
        await this.notificationsService.createNotification(
          senderId,
          recipientId,
          'connection_request_cancelled',
          `You cancelled your connection request to ${recipientObj.username}`,
        );

        this.notificationsGateway.sendNotification(senderId, recipientId, {
          type: 'connection_request_cancelled',
          message: `You cancelled your connection request to ${recipientObj.username}`,
        });
      } catch (notificationError) {
        console.warn('Notification handling failed:', notificationError);
      }

      return { message: 'Connection request cancelled successfully' };
    } catch (error: unknown) {
      console.error('Error in cancelConnectionRequest:', {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
        userId,
        senderId,
        recipientId,
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'Failed to cancel connection request',
      );
    }
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
    }

    if (status === 'rejected') {
      await this.notificationsService.createNotification(
        connection.requester.id,
        connection.recipient.id,

        'connection_rejected',
        `You have rejected the connection request from ${connection.requester.username}`,
      );

      this.notificationsGateway.sendNotification(
        connection.requester.id,
        connection.recipient.id,

        {
          type: 'connection_rejected',
          message: `You have rejected the connection request from ${connection.requester.username}`,
        },
      );
    }

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
