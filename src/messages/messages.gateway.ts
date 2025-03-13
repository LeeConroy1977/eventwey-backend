// messages.gateway.ts
import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection } from 'src/entities/connection.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { User } from 'src/entities/user.entity';
import { Message } from 'src/entities/message.entity';


@WebSocketGateway()
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private clients = new Map<string, Socket>();

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Connection)
    private userRepository: Repository<User>,
    @InjectRepository(Connection)
    private connectionRepository: Repository<Connection>,
    private notificationService: NotificationsService,
  ) {}


  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    
    const userIdString = Array.isArray(userId) ? userId[0] : userId;
  
    if (userIdString) {
      this.clients.set(userIdString, client);
    }
  }

  handleDisconnect(client: Socket) {
    this.clients.forEach((socket, userId) => {
      if (socket === client) {
        this.clients.delete(userId);
      }
    });
  }

  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() { senderId, recipientId, content }: { senderId: number; recipientId: number; content: string }) {

    const connection = await this.connectionRepository.findOne({
      where: [
        { requester: { id: senderId }, recipient: { id: recipientId }, status: 'accepted' },
        { requester: { id: recipientId }, recipient: { id: senderId }, status: 'accepted' },
      ],
    });

    if (!connection) {
      return; 
    }

    const sender = this.clients.get(senderId.toString());
    const recipient = this.clients.get(recipientId.toString());

    if (!sender || !recipient) {
      return;
    }

 
    const message = new Message();
    message.sender = await this.userRepository.findOneBy({ id: senderId });
    message.recipient = await this.userRepository.findOneBy({ id: recipientId });
    message.content = content;
    await this.messageRepository.save(message);

    recipient.emit('message_received', { senderId, content });

    if (senderId !== recipientId) {
      this.notificationService.createNotification(
        recipientId,
        senderId,
        'Message',
        `${senderId} sent you a message`

      );
    }
  }
}
