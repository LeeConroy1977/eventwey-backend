import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Search,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dtos/create-event-dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Request } from 'express';
import { AppEvent } from '../entities/event.entity';
import { StripeService } from '../stripe/stripe.service';
import {
  IsInt,
  Min,
  IsString,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationPipe } from '@nestjs/common';

interface AuthenticatedRequest extends Request {
  user: { id: number; username: string; email: string };
}

class CreatePaymentIntentDto {
  @IsInt()
  @Min(1)
  eventId: number;

  @IsString()
  @IsNotEmpty()
  ticketType: string;
}

function parsePriceToCents(priceStr: string): number {
  const cleaned = priceStr.replace(/[^\d.]/g, '');
  const price = parseFloat(cleaned);
  if (isNaN(price)) {
    throw new BadRequestException('Invalid price format');
  }
  return Math.round(price * 100);
}

@Controller('events')
export class EventsController {
  constructor(
    private eventsService: EventsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post()
  createEvent(@Body() body: CreateEventDto) {
    return this.eventsService.createEvent(body);
  }

  @Get()
  async findAllEvents(
    @Query('date') date: string,
    @Query('category') category: string,
    @Query('sortBy') sortBy: string,
    @Query('search') search: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const limitNumber =
      isNaN(Number(limit)) || Number(limit) <= 0 ? 15 : Number(limit);
    const pageNumber =
      isNaN(Number(page)) || Number(page) <= 0 ? 1 : Number(page);

    console.log(search, 'searchParam');

    return this.eventsService.findAllEvents(
      { date, category, sortBy, search },
      { limit: limitNumber, page: pageNumber },
    );
  }

  @Get('/:id')
  async findEventById(@Param('id', ParseIntPipe) eventId: number) {
    return this.eventsService.findEventById(eventId);
  }

  @Get('/:id/attendees')
  async findEventAttendees(@Param('id', ParseIntPipe) eventId: number) {
    return this.eventsService.findEventAttendees(eventId);
  }

  @Get('/:id/group')
  async findEventGroup(@Param('id', ParseIntPipe) eventId: number) {
    return this.eventsService.findEventGroup(eventId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:id/join')
  async joinEvent(
    @Param('id', ParseIntPipe) eventId: number,
    @Req() req: AuthenticatedRequest,
    @Query('ticketType') ticketType?: string,
    @Body('paymentIntentId') paymentIntentId?: string,
  ): Promise<AppEvent> {
    const userId = req.user.id;
    console.log('Join event request:', {
      eventId,
      userId,
      ticketType,
      paymentIntentId,
    });
    return this.eventsService.addUserToEvent(
      eventId,
      userId,
      ticketType,
      paymentIntentId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-payment-intent')
  async createPaymentIntent(
    @Body(ValidationPipe) body: CreatePaymentIntentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { eventId, ticketType } = body;
    const userId = req.user.id;

    const event = await this.eventsService.findEventById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    console.log(
      'controller Available types:',
      event.priceBands?.map((b) => b.type) || [],
    );
    console.log('controller Looking for:', ticketType);

    if (!event.free && (!event.priceBands || event.priceBands.length === 0)) {
      throw new BadRequestException(
        'No ticket types are available for this event',
      );
    }

    const priceBand = event.priceBands?.find(
      (band) =>
        band.type.trim().toLowerCase() === ticketType.trim().toLowerCase(),
    );
    if (!priceBand) {
      throw new BadRequestException(
        `Ticket type "${ticketType}" is not available`,
      );
    }

    const amountInCents = parsePriceToCents(priceBand.price); // e.g., "£10" -> 1000
    console.log('Creating payment intent with amount (cents):', amountInCents);

    const paymentIntent = await this.stripeService.createPaymentIntent(
      amountInCents,
      'gbp',
      {
        eventId: eventId.toString(),
        userId: userId.toString(),
        ticketType,
      },
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:id/leave')
  async leaveEvent(
    @Param('id', ParseIntPipe) eventId: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const userId = req.user.id;
    return this.eventsService.leaveEvent(eventId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('backfill-payment-intents')
  async backfillPaymentIntents() {
    return this.eventsService.backfillPaymentIntents();
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
