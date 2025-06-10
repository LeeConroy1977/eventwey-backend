import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppEvent } from '../entities/event.entity';
import { Equal, In, LessThan, Repository } from 'typeorm';
import { CreateEventDto } from './dtos/create-event-dto';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';
import { GroupsService } from '../groups/groups.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(AppEvent)
    private readonly repo: Repository<AppEvent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private groupService: GroupsService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredEvents() {
    const currentTime = Date.now();

    const expiredEvents = await this.repo.find({
      where: { date: LessThan(currentTime) },
    });

    for (const event of expiredEvents) {
      const updatedDate = new Date(event.date);
      updatedDate.setMonth(updatedDate.getMonth() + 1);
      event.date = updatedDate.getTime();
      await this.repo.save(event);
      console.log(`Event ${event.id} has been rescheduled to ${updatedDate}`);
    }
  }

  async findAllEvents(
    filters: { date?: string; category?: string; sortBy?: string },
    pagination: { limit?: number; page?: number } = { limit: 12, page: 1 },
  ): Promise<any[]> {
    try {
      const { date, category, sortBy } = filters;
      const { limit = 12, page = 1 } = pagination;

      const whereConditions: any = {};

      if (date) {
        const today = new Date();
        let startTimestamp: number;
        let endTimestamp: number;

        switch (date) {
          case 'today':
            startTimestamp = today.setHours(0, 0, 0, 0);
            endTimestamp = today.setHours(23, 59, 59, 999);
            whereConditions.date = { $gte: startTimestamp, $lte: endTimestamp };
            break;
          case 'tomorrow':
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            startTimestamp = tomorrow.setHours(0, 0, 0, 0);
            endTimestamp = tomorrow.setHours(23, 59, 59, 999);
            whereConditions.date = { $gte: startTimestamp, $lte: endTimestamp };
            break;
          case 'thisweek':
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            startTimestamp = startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endTimestamp = endOfWeek.setHours(23, 59, 59, 999);
            whereConditions.date = { $gte: startTimestamp, $lte: endTimestamp };
            break;
          case 'nextweek':
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const startOfNextWeek = new Date(nextWeek);
            startOfNextWeek.setDate(
              startOfNextWeek.getDate() - startOfNextWeek.getDay(),
            );
            startTimestamp = startOfNextWeek.setHours(0, 0, 0, 0);
            const endOfNextWeek = new Date(startOfNextWeek);
            endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
            endTimestamp = endOfNextWeek.setHours(23, 59, 59, 999);
            whereConditions.date = { $gte: startTimestamp, $lte: endTimestamp };
            break;
          case 'thismonth':
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startTimestamp = startOfMonth.setHours(0, 0, 0, 0);
            const endOfMonth = new Date(startOfMonth);
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            endOfMonth.setDate(0);
            endTimestamp = endOfMonth.setHours(23, 59, 59, 999);
            whereConditions.date = { $gte: startTimestamp, $lte: endTimestamp };
            break;
          case 'nextmonth':
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const startOfNextMonth = new Date(nextMonth);
            startOfNextMonth.setDate(1);
            startTimestamp = startOfNextMonth.setHours(0, 0, 0, 0);
            const endOfNextMonth = new Date(startOfNextMonth);
            endOfNextMonth.setMonth(endOfNextMonth.getMonth() + 1);
            endOfNextMonth.setDate(0);
            endTimestamp = endOfNextMonth.setHours(23, 59, 59, 999);
            whereConditions.date = { $gte: startTimestamp, $lte: endTimestamp };
            break;
          default:
            break;
        }
      }

      if (category) {
        whereConditions.category = category;
      }

      let order: any = { date: 'ASC' };
      switch (sortBy) {
        case 'latest':
          order = { date: 'DESC' };
          break;
        case 'popular':
          order = { going: 'DESC' };
          break;
        case 'free':
          whereConditions.free = true;
          order = { date: 'ASC' };
          break;
        case 'date':
          order = { date: 'ASC' };
          break;
        default:
          order = { date: 'ASC' };
          break;
      }

      const skip = (page - 1) * limit;

      console.log('Query conditions:', {
        where: whereConditions,
        order,
        skip,
        take: limit,
      });

      const events = await this.repo.find({
        where: whereConditions,
        order,
        skip,
        take: limit,
        relations: ['group', 'attendees'],
      });

      return events.map((event) => ({
        ...event,
        date: event.date, // Already a timestamp
        attendees: event.attendees.map((attendee) => attendee.id),
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('Error in findAllEvents:', error);
      throw new Error(`Failed to fetch events: ${errorMessage}`);
    }
  }

  async findEventById(eventId: number) {
    const event = await this.repo.findOne({
      where: { id: eventId },
      relations: ['group', 'attendees'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return {
      ...event,
      date: event.date, // Already a timestamp
      attendees: event.attendees.map((attendee) => attendee.id),
    };
  }

  async findEventAttendees(eventId: number): Promise<User[]> {
    const event = await this.findEventById(eventId);

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const attendees = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.events', 'event')
      .where('event.id = :eventId', { eventId })
      .loadAllRelationIds({ relations: ['events'] })
      .getMany();

    return attendees;
  }

  async findEventGroup(eventId: number) {
    const event = await this.findEventById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    const groupId = event.group.id;

    const group = await this.groupService.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Event group not found`);
    }

    return group;
  }

  async createEvent(body: CreateEventDto): Promise<any> {
    const groupDto = await this.groupService.findGroupById(body.group);
    if (!groupDto) {
      throw new NotFoundException(`Group with ID ${body.group} not found`);
    }

    const group = await this.groupRepository.findOne({
      where: { id: body.group },
      relations: ['groupAdmins', 'members', 'events'],
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${body.group} not found`);
    }

    if (!body.title || !body.category || !body.date || !body.location) {
      throw new BadRequestException('All required fields must be provided');
    }

    const date =
      typeof body.date === 'string' ? new Date(body.date) : new Date(body.date);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date provided');
    }

    const newEvent = this.repo.create({
      ...body,
      date: date.getTime(),
      group,
      attendees: [],
    });

    const groupMembers = await this.groupService.findGroupMembers(group.id);
    console.log('groupMembers:', groupMembers);

    const groupOrganisor = group.groupAdmins?.[0] || null;
    if (
      groupOrganisor &&
      Array.isArray(groupMembers) &&
      groupMembers.length > 0
    ) {
      for (const groupMember of groupMembers) {
        await this.notificationsService.createNotification(
          groupMember.id,
          groupOrganisor.id,
          'new-group-event',
          `${group.name} has created a new event: ${body.title}`,
        );
      }
    } else {
      console.log(
        'No group organiser or no group members found for notifications',
      );
    }

    const savedEvent = await this.repo.save(newEvent);
    console.log('savedEvent:', savedEvent);

    return {
      ...savedEvent,
      date: savedEvent.date,
      attendees: Array.isArray(savedEvent.attendees)
        ? savedEvent.attendees.map((attendee) => attendee.id)
        : [],
      group: {
        ...savedEvent.group,
        events: Array.isArray(savedEvent.group.events)
          ? savedEvent.group.events.map((e) => e.id)
          : [],
        members: Array.isArray(savedEvent.group.members)
          ? savedEvent.group.members.map((m) => m.id)
          : [],
      },
    };
  }

  async updateEvent(
    eventId: number,
    updateData: Partial<AppEvent>,
  ): Promise<any> {
    const event = await this.repo.findOne({
      where: { id: eventId },
      relations: ['group', 'attendees'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    Object.assign(event, updateData);

    const updatedEvent = await this.repo.save(event);
    return {
      ...updatedEvent,
      date: updatedEvent.date, // Already a timestamp
      attendees: updatedEvent.attendees.map((attendee) => attendee.id),
    };
  }

  async addUserToEvent(
    eventId: number,
    userId: number,
    ticketType?: string,
  ): Promise<any> {
    const event = await this.repo.findOne({
      where: { id: eventId },
      relations: ['group', 'attendees'],
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

    const updateData: Partial<AppEvent> = {};

    if (event.free) {
      if (event.availability <= 0) {
        throw new BadRequestException('No spots left for this event');
      }
      updateData.availability = event.availability - 1;
      updateData.going = (event.going || 0) + 1;
    } else {
      if (!event.priceBands || event.priceBands.length === 0) {
        throw new BadRequestException(
          'No ticket options available for this event',
        );
      }

      if (!ticketType) {
        throw new BadRequestException('Ticket type is required for this event');
      }

      const priceBand = event.priceBands.find(
        (band) => band.type === ticketType,
      );
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
      updateData.priceBands = [...event.priceBands];
      updateData.availability = event.availability - 1;
      updateData.going = (event.going || 0) + 1;
    }
    event.attendees.push(user);

    const updatedEvent = await this.updateEvent(eventId, {
      ...updateData,
      attendees: event.attendees,
    });

    return updatedEvent; // Already formatted by updateEvent
  }

  async leaveEvent(eventId: number, userId: number): Promise<any> {
    const event = await this.repo.findOne({
      where: { id: eventId },
      relations: ['group', 'attendees'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.attendees || event.attendees.length === 0) {
      throw new NotFoundException('No attendees in this event');
    }

    const userExists = event.attendees.some(
      (attendee) => attendee.id === userId,
    );
    if (!userExists) {
      throw new NotFoundException('User not found in event attendees');
    }

    event.attendees = event.attendees.filter(
      (attendee) => attendee.id !== userId,
    );

    const updateData: Partial<AppEvent> = {
      attendees: event.attendees,
      availability: event.availability + 1,
      going: Math.max((event.going || 0) - 1, 0),
    };

    if (event.priceBands && Array.isArray(event.priceBands)) {
      const priceBandIndex = event.priceBands.findIndex(
        (p) => p.type === 'Standard',
      );
      if (priceBandIndex !== -1) {
        event.priceBands[priceBandIndex].ticketCount += 1;
        updateData.priceBands = [...event.priceBands];
      }
    }

    const updatedEvent = await this.updateEvent(eventId, updateData);
    return updatedEvent; // Already formatted by updateEvent
  }

  async deleteEvent(
    eventId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const event = await this.repo.findOne({
      where: { id: eventId },
      relations: ['group'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (!event.group) {
      throw new NotFoundException(`Event does not belong to a group`);
    }

    const groupId = event.group.id;

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['groupAdmins'],
    });

    if (!group) {
      throw new NotFoundException(`Group not found for event ID ${eventId}`);
    }

    const isAdmin = group.groupAdmins.some((admin) => admin.id === userId);
    if (!isAdmin) {
      throw new ForbiddenException(
        `You do not have permission to delete this event`,
      );
    }

    await this.repo.delete(eventId);
    return { message: `Event ${eventId} has been successfully deleted` };
  }
}
