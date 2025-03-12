import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppEvent } from 'src/entities/event.entity';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dtos/create-event-dto';
import { User } from 'src/entities/user.entity';
import { classToPlain } from 'class-transformer';
import { Group } from 'src/entities/group.entity';
import { GroupsService } from 'src/groups/groups.service';
import { NotificationsService } from 'src/notifications/notifications.service';

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

  async findAllEvents() {
    const events = await this.repo.find({
      loadRelationIds: true,
    });


    return events;
  }

  async findEventById(eventId: number) {
    const event = await this.repo.findOne({
      where: { id: eventId },
      relations: ['group', 'attendees'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return classToPlain(event);
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
    const groupId = event.group;

    const group = await this.groupService.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Event group  not found`);
    }

    return group;
  }

  async createEvent(body: CreateEventDto) {
    const groupId = body.group;
    const group = await this.groupService.findGroupById(groupId);

    const newEvent = await this.repo.create({
      ...body,
      group,

      attendees: [],
    });

    

    

    console.log(group);

    const groupMembers = await this.groupService.findGroupMembers(group.id);
    console.log(groupMembers, 'group membersxxxxxxxx');
    const groupOrganisor = group.groupAdmins[0];

    for (const groupMember of groupMembers) {
      await this.notificationsService.createNotification(
        groupMember.id,
        1,
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
