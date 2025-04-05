import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppEvent } from '../entities/event.entity';
import { LessThan, Repository } from 'typeorm';
import { CreateEventDto } from './dtos/create-event-dto';
import { User } from '../entities/user.entity';
import { classToPlain } from 'class-transformer';
import { Group } from '../entities/group.entity';
import { GroupsService } from '../groups/groups.service';
import { NotificationsService } from '../notifications/notifications.service';
import { validate } from 'class-validator';
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
    pagination: { limit?: number; page?: number } = { limit: 12, page: 1 }, // Move defaults here
  ): Promise<any[]> {
    try {
      const { date, category, sortBy } = filters;
      const { limit = 12, page = 1 } = pagination; // Apply defaults at runtime

      const whereConditions: any = {};

      if (date) {
        const today = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (date) {
          case 'today':
            startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            whereConditions.date = { $gte: startDate, $lte: endDate };
            break;
          case 'tomorrow':
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            startDate = new Date(tomorrow);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(tomorrow);
            endDate.setHours(23, 59, 59, 999);
            whereConditions.date = { $gte: startDate, $lte: endDate };
            break;
          case 'thisweek':
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            whereConditions.date = { $gte: startOfWeek, $lte: endOfWeek };
            break;
          case 'nextweek':
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const startOfNextWeek = new Date(nextWeek);
            startOfNextWeek.setDate(
              startOfNextWeek.getDate() - startOfNextWeek.getDay(),
            );
            startOfNextWeek.setHours(0, 0, 0, 0);
            const endOfNextWeek = new Date(startOfNextWeek);
            endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
            endOfNextWeek.setHours(23, 59, 59, 999);
            whereConditions.date = {
              $gte: startOfNextWeek,
              $lte: endOfNextWeek,
            };
            break;
          case 'thismonth':
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const endOfMonth = new Date(startOfMonth);
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            endOfMonth.setDate(0);
            endOfMonth.setHours(23, 59, 59, 999);
            whereConditions.date = { $gte: startOfMonth, $lte: endOfMonth };
            break;
          case 'nextmonth':
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const startOfNextMonth = new Date(nextMonth);
            startOfNextMonth.setDate(1);
            startOfNextMonth.setHours(0, 0, 0, 0);
            const endOfNextMonth = new Date(startOfNextMonth);
            endOfNextMonth.setMonth(endOfNextMonth.getMonth() + 1);
            endOfNextMonth.setDate(0);
            endOfNextMonth.setHours(23, 59, 59, 999);
            whereConditions.date = {
              $gte: startOfNextMonth,
              $lte: endOfNextMonth,
            };
            break;
          default:
            break;
        }
      }

      if (category) {
        whereConditions.category = category;
      }

      let order: any = { date: 'ASC' }; // Default order
      switch (sortBy) {
        case 'latest':
          order = { date: 'DESC' };
          break;
        case 'popular':
          order = { going: 'DESC' }; // Sort by number of attendees
          break;
        case 'free':
          whereConditions.free = true; // Filter for free events
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
        order: order,
        skip: skip,
        take: limit,
        loadRelationIds: true,
        relations: ['group'],
      });

      // Ensure dates are returned as timestamps to match frontend expectation
      const formattedEvents = events.map((event) => ({
        ...event,
        date: new Date(event.date).getTime(),
      }));

      return formattedEvents;
    } catch (error) {
      // Type assertion to handle 'unknown' error
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
      loadRelationIds: true, // Keep this to get groupId as scalar
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Manually map to match findAllEvents
    const formattedEvent = {
      ...event,
      date: new Date(event.date).getTime(),
    };

    return formattedEvent;
  }

  async findEventAttendees(eventId: number) {
    const event = await this.findEventById(eventId);

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const attendees = await this.userRepository.find({
      where: {
        groups: { id: eventId },
      },
      loadRelationIds: true,
    });

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
      throw new NotFoundException(`Event group  not found`);
    }

    return group;
  }

  async createEvent(body: CreateEventDto) {
    const groupId = body.group;
    const group = await this.groupService.findGroupById(groupId);
    const { title, category, date, startTime, location } = body;

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // Check for missing required fields
    if (!title || !category || !group || !location) {
      throw new BadRequestException('All required fields must be provided');
    }

    const newEvent = await this.repo.create({
      ...body,
      group,
      attendees: [],
    });

    const groupMembers = await this.groupService.findGroupMembers(group.id);
    console.log(groupMembers, 'group membersxxxxxxxx');

    const groupOrganisor =
      group.groupAdmins && group.groupAdmins.length > 0
        ? group.groupAdmins[0]
        : null;

    if (!groupOrganisor) {
      console.log('No group organiser found');
    }

    for (const groupMember of groupMembers) {
      await this.notificationsService.createNotification(
        groupMember.id,
        group.groupAdmins[0].id,
        'new-group-event',
        `${group.name} has created a new event: ${body.title}`,
      );
    }

    return this.repo.save(newEvent);
  }

  async updateEvent(
    eventId: number,
    updateData: Partial<AppEvent>,
  ): Promise<AppEvent> {
    const event = await this.repo.findOne({
      where: { id: eventId },
      relations: ['group', 'attendees'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    Object.assign(event, updateData);

    return this.repo.save(event);
  }

  async addUserToEvent(
    eventId: number,
    userId: number,
    ticketType?: string,
  ): Promise<AppEvent> {
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

    return this.repo.findOne({
      where: { id: updatedEvent.id },
      loadRelationIds: true,
    });
  }

  async leaveEvent(eventId: number, userId: number): Promise<AppEvent> {
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

    return this.repo.findOne({
      where: { id: updatedEvent.id },
      loadRelationIds: true,
    });
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
