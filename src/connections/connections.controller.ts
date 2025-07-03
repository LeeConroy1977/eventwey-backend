import {
  Controller,
  Post,
  Param,
  Get,
  Delete,
  Req,
  UseGuards,
  Body,
  ParseIntPipe,
  ParseArrayPipe,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { ResponseUserDto } from '../users/dtos/response-user-dto';
import { Serialize } from '../interceptors/serialize.interceptor';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { User } from 'src/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: { id: number; username: string; email: string };
}

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Serialize(ResponseUserDto)
  @Post(':senderId/request/:recipientId')
  sendRequest(
    @Param('senderId') senderId: number,
    @Param('recipientId') recipientId: number,
  ) {
    return this.connectionsService.sendConnectionRequest(senderId, recipientId);
  }

  @Post('accept/:requestId')
  acceptRequest(@Param('requestId') requestId: number) {
    return this.connectionsService.updateConnectionStatus(
      requestId,
      'accepted',
    );
  }

  @Post('reject/:requestId')
  rejectRequest(@Param('requestId') requestId: number) {
    return this.connectionsService.updateConnectionStatus(
      requestId,
      'rejected',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite/:eventId')
  async inviteToEvent(
    @Req() req: AuthenticatedRequest,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body(
      'recipientIds',
      new ParseArrayPipe({ items: Number, optional: false }),
    )
    recipientIds: number[],
  ) {
    return await this.connectionsService.inviteToEvent(
      req.user.id,
      recipientIds,
      eventId,
    );
  }
  @Serialize(ResponseUserDto)
  @Get(':userId')
  getUserConnections(@Param('userId') userId: number): Promise<User[]> {
    return this.connectionsService.getUserConnections(userId);
  }

  @Get(':userId/requests')
  findUserRequests(@Param('userId') userId: number) {
    return this.connectionsService.findUserRequests(userId);
  }

  @Get(':userId/sent-requests')
  findUserSentRequests(@Param('userId') userId: number) {
    return this.connectionsService.findUserSentRequests(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(`:senderId/cancel/:recipientId`)
  cancelConnectionRequest(
    @Req() req: AuthenticatedRequest,
    @Param('senderId', ParseIntPipe) senderId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ) {
    return this.connectionsService.cancelConnectionRequest(
      req.user.id,
      senderId,
      recipientId,
    );
  }

  @Delete(':userId/remove/:connectionId')
  removeConnection(
    @Param('userId') userId: number,
    @Param('connectionId') connectionId: number,
  ) {
    return this.connectionsService.removeConnection(userId, connectionId);
  }
}
