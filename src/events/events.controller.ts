import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dtos/create-event-dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Request } from 'express';
import { AppEvent } from 'src/entities/event.entity';

interface AuthenticatedRequest extends Request {
  user: { id: number; username: string; email: string };
}

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  createEvent(@Body() body: CreateEventDto) {
    return this.eventsService.createEvent(body);
  }

  @Get()
  async findAllEvents() {
    return await this.eventsService.findAllEvents();
  }
  @UseGuards(JwtAuthGuard)
  @Post('/:id/join')
  async joinEvent(
    @Param('id', ParseIntPipe) eventId: number,
    @Req() req: AuthenticatedRequest,
    @Query('ticketType') ticketType?: string,
  ): Promise<AppEvent> {
    const userId = req.user.id;
    return this.eventsService.addUserToEvent(eventId, userId, ticketType);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:id/leave')
  async leaveEvent(@Param('id', ParseIntPipe) eventId: number, @Req() req) {
    const userId = req.user.id;
    return this.eventsService.leaveEvent(eventId, userId);
  }
}
