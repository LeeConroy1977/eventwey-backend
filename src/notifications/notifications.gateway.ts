import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<number, string>(); 


  handleConnection(client: any) {
    const userId = client.handshake.query.userId;
    if (userId) this.onlineUsers.set(Number(userId), client.id);
  }


  handleDisconnect(client: any) {
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
        break;
      }
    }
  }

  sendNotification(userId: number, senderId: number, notification: any) {
    const socketId = this.onlineUsers.get(userId);
    if (socketId) this.server.to(socketId).emit('notification', notification);
  }


  @SubscribeMessage('send_notification')
  sendManualNotification(
    @MessageBody() data: { userId: number; senderId: number; message: string },
  ) {
    this.sendNotification(data.userId, data.senderId, {
      type: 'manual',
      message: data.message,
    });
  }
}
