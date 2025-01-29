import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppEvent } from 'src/entities/event.entity';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dtos/create-event-dto';
import { User } from 'src/entities/user.entity';
import { classToPlain } from 'class-transformer';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(AppEvent)
    private readonly repo: Repository<AppEvent>,
    @InjectRepository(User) // Inject UserRepository
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllEvents() {
    const events = await this.repo.find({
      relations: ['group', 'attendees'],
    });

    const plainEvents = events.map((event) => classToPlain(event));

    return plainEvents;
  }

  async createEvent(body: CreateEventDto) {
    const newEvent = this.repo.create({
      ...body,
      group: { id: body.group },
      attendees: [],
    });
    return this.repo.save(newEvent);
  }

  async addUserToEvent(
    eventId: number,
    userId: number,
    ticketType?: string,
  ): Promise<AppEvent> {
    const event = await this.repo.findOne({
      where: { id: eventId },
      relations: ['attendees'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (event.attendees.some((attendee) => attendee.id === userId)) {
      throw new BadRequestException('User is already attending this event');
    }

    if (event.free) {
      if (event.availability <= 0) {
        throw new BadRequestException('No spots left for this event');
      }
      event.attendees.push(user);
      event.availability -= 1;
      event.going = (event.going || 0) + 1;

      await this.repo.save(event);
      return event;
    }

    if (!event.priceBands || event.priceBands.length === 0) {
      throw new BadRequestException(
        'No ticket options available for this event',
      );
    }

    if (!ticketType) {
      throw new BadRequestException('Ticket type is required for this event');
    }

    const priceBand = event.priceBands.find((band) => band.type === ticketType);

    if (!priceBand) {
      throw new BadRequestException(
        `Ticket type "${ticketType}" is not available`,
      );
    }

    if (priceBand.ticketCount <= 0) {
      throw new BadRequestException(
        `No more tickets available for "${ticketType}"`,
      );
    }

    priceBand.ticketCount -= 1;
    event.availability -= 1;
    event.going = (event.going || 0) + 1;

    event.attendees.push(user);

    await this.repo.save(event);
  }

  async leaveEvent(eventId: number, userId: number) {
    const event = await this.repo.findOne({
      where: { id: eventId },
      relations: ['attendees'],
    });
    if (!event) {
      throw new Error('Event not found');
    }
    if (!event.attendees) {
      event.attendees = [];
    }
    const userExists = event.attendees.some((user) => user.id === userId);
    if (!userExists) {
      throw new NotFoundException('User not found in event attendees');
    }
    event.attendees = event.attendees.filter((user) => user.id !== userId);

    if (event.priceBands && Array.isArray(event.priceBands)) {
      const priceBandIndex = event.priceBands.findIndex(
        (p) => p.type === 'Standard',
      );

      if (priceBandIndex !== -1) {
        event.priceBands[priceBandIndex].ticketCount -= 1;
      }
    }

    await this.repo.save(event);
  }
}
