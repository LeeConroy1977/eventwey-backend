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

  private onlineUsers = new Map<number, string>(); // Store user sockets

  // 📌 When a user connects, store their socket
  handleConnection(client: any) {
    const userId = client.handshake.query.userId;
    if (userId) this.onlineUsers.set(Number(userId), client.id);
  }

  // 📌 When a user disconnects, remove from online users
  handleDisconnect(client: any) {
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
        break;
      }
    }
  }

  // 🔔 Send a notification to a specific user
  sendNotification(userId: number, senderId: number, notification: any) {
    const socketId = this.onlineUsers.get(userId);
    if (socketId) this.server.to(socketId).emit('notification', notification);
  }

  // 📨 Listen for manual notification requests
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
