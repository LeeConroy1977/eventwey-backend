import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dtos/create-event-dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Request } from 'express';
import { AppEvent } from '../entities/event.entity';


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
  async findAllEvents(
    @Query('date') date: string,
    @Query('category') category: string,
    @Query('sortBy') sortBy: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const limitNumber =
      isNaN(Number(limit)) || Number(limit) <= 0 ? 15 : Number(limit);
    const pageNumber =
      isNaN(Number(page)) || Number(page) <= 0 ? 1 : Number(page);

    return this.eventsService.findAllEvents(
      { date, category, sortBy },
      { limit: limitNumber, page: pageNumber },
    );
  }

  @Get('/:id')
  async findEventById(@Param('id', ParseIntPipe) eventId: number) {
    const event = await this.eventsService.findEventById(eventId);
    return event;
  }

  @Get('/:id/attendees')
  async findEventAttendees(@Param('id', ParseIntPipe) eventId: number) {
    return this.eventsService.findEventAttendees(eventId);
  }

  @Get('/:id/group')
  async findEventGroup(@Param('id', ParseIntPipe) eventId: number) {
    const group = await this.eventsService.findEventGroup(eventId);
    return group;
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

  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  async updateEvent(
    @Param('id', ParseIntPipe) eventId: number,
    @Body() updateData: Partial<AppEvent>,
  ): Promise<AppEvent> {
    return this.eventsService.updateEvent(eventId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':eventId')
  async deleteEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.eventsService.deleteEvent(eventId, userId);
  }
}
