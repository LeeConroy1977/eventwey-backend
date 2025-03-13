import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dtos/create-message-dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { MessageResponseDto } from './dtos/message-response-dto';

interface AuthenticatedRequest extends Request {
  user: { id: number; username: string; email: string };
}

@Serialize(MessageResponseDto)
@Controller('messages')

export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}


@UseGuards(JwtAuthGuard)
  @Post('send')
  async sendMessage(@Query('recipientId') recipientId: number, @Req() req: AuthenticatedRequest,@Body() body: CreateMessageDto ) {
    const userId = req.user.id
    return await this.messagesService.sendMessage(recipientId,userId, body);
  }

@UseGuards(JwtAuthGuard)
  @Get('conversation')
  async getConversation(@Query('recipientId') recipientId: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user.id
    return await this.messagesService.getConversation(recipientId, userId);
  }
 
@UseGuards(JwtAuthGuard)
  @Get()
  async getAllMessages(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id
    return await this.messagesService.getAllMessages(userId);
  }
}

