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
import { ResponseUserDto } from 'src/users/dtos/response-user-dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

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

  @Get(':userId')
  getUserConnections(@Param('userId') userId: number) {
    return this.connectionsService.getUserConnections(userId);
  }

  @Delete(':userId/remove/:connectionId')
  removeConnection(
    @Param('userId') userId: number,
    @Param('connectionId') connectionId: number,
  ) {
    return this.connectionsService.removeConnection(userId, connectionId);
  }
}
