import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Group } from '../entities/group.entity';
import { User } from '../entities/user.entity';
import { Notification } from '../entities/notification.entity';
import { AppEvent } from '../entities/event.entity';
import { In, Repository } from 'typeorm';
import { group } from 'console';

interface EventFilters {
  category?: string;
  dateRange?: string;
  sort?: 'popular' | 'latest' | 'free';
  limit?: string;
  page?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(AppEvent)
    private readonly eventRepository: Repository<AppEvent>,
  ) {}

  async findAllUsers() {
    const users = await this.repo.find({
      loadRelationIds: true,
    });

    return users;
  }

  async createUser(username: string, email: string, password: string) {
    const user = await this.repo.create({ username, email, password });
    return this.repo.save(user);
  }
  async findUserById(id: number): Promise<User> {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['comments'],
      loadRelationIds: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    return this.repo.findOne({ where: { googleId }, loadRelationIds: true });
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.repo.findOne({
      where: { email },
      loadRelationIds: true,
    });
    if (!user) return null;

    return user;
  }

  async findUsersWithEmail(email: string) {
    const users = await this.repo.find({
      where: { email: email },
      loadRelationIds: true,
    });

    if (!users) return null;

    return users;
  }

  async findUserConnections(id: number) {
    const connections = await this.repo.find({
      where: {
        connections: { id },
      },
    });
    return connections;
  }

  async findUserEvents(userId: number, filters: EventFilters): Promise<any[]> {
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.repo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const query = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.group', 'group')
      .leftJoin('event.attendees', 'attendees')
      .loadRelationIdAndMap('event.attendees', 'event.attendees')
      .where('attendees.id = :userId', { userId });

    if (filters.category) {
      query.andWhere('event.category = :category', {
        category: filters.category,
      });
    }

    if (filters.dateRange) {
      const today = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'tomorrow':
          startDate = new Date(today);
          startDate.setDate(today.getDate() + 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'thisWeek':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setDate(today.getDate() + (6 - today.getDay()));
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'nextWeek':
          startDate = new Date(today);
          startDate.setDate(today.getDate() + (7 - today.getDay()));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'thisMonth':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'nextMonth':
          startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          throw new BadRequestException(
            `Invalid dateRange: ${filters.dateRange}`,
          );
      }

      if (startDate && endDate) {
        query.andWhere('event.date BETWEEN :startDate AND :endDate', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
      }
    }

    if (filters.sort === 'popular') {
      query.orderBy('event.attendees.length', 'DESC');
    } else if (filters.sort === 'latest') {
      query.orderBy('event.date', 'DESC');
    } else if (filters.sort === 'free') {
      query.andWhere('event.price = 0');
    }

    const limit =
      filters.limit && !isNaN(parseInt(filters.limit, 10))
        ? parseInt(filters.limit, 10)
        : 10;
    const page =
      filters.page && !isNaN(parseInt(filters.page, 10))
        ? parseInt(filters.page, 10)
        : 1;
    if (limit <= 0 || page <= 0) {
      throw new BadRequestException('Limit and page must be positive numbers');
    }
    query.skip((page - 1) * limit).take(limit);

    console.log('Generated SQL:', query.getSql());

    const events = await query.getMany();

    return events;
  }

  async findUserGroups(userId: number): Promise<Group[]> {
    return this.groupRepository.find({
      where: {
        members: {
          id: userId,
        },
      },
      relations: ['members', 'groupAdmins', 'events'],
      loadRelationIds: true,
    });
  }

  async findAdminGroups(userId: number): Promise<Group[]> {
    return this.groupRepository.find({
      where: {
        groupAdmins: { id: userId },
      },
      relations: ['members', 'groupAdmins', 'events'],
      loadRelationIds: true,
    });
  }

  async findUserNotifications(userId: number): Promise<Notification[]> {
    const user = await this.repo.findOne({
      where: { id: userId },
      relations: ['notifications'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.notifications;
  }
  async updateUser(id: number, attrs: Partial<User>): Promise<User> {
    console.log(
      'Updating user ID:',
      id,
      'with attrs:',
      JSON.stringify(attrs, null, 2),
    );
    const user = await this.findUserById(id);
    if (attrs.email) {
      const existingUser = await this.repo.findOne({
        where: { email: attrs.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Email already exists');
      }
    }
    if (attrs.tags !== undefined) {
      if (
        !Array.isArray(attrs.tags) ||
        !attrs.tags.every((tag) => typeof tag === 'string')
      ) {
        throw new BadRequestException('Tags must be an array of strings');
      }
    }
    if (attrs.events !== undefined) {
      if (
        !Array.isArray(attrs.events) ||
        !attrs.events.every((id) => typeof id === 'number')
      ) {
        throw new BadRequestException('Events must be an array of event IDs');
      }
      const validEvents = await this.eventRepository.count({
        where: { id: In(attrs.events) },
      });
      if (validEvents !== attrs.events.length) {
        throw new BadRequestException('One or more event IDs are invalid');
      }
    }
    // Prepare update data for scalar fields only
    const updateData: Partial<User> = {
      email: attrs.email,
      username: attrs.username,
      password: attrs.password,
      googleId: attrs.googleId,
      authMethod: attrs.authMethod,
      profileBackgroundImage: attrs.profileBackgroundImage,
      profileImage: attrs.profileImage,
      aboutMe: attrs.aboutMe,
      bio: attrs.bio,
      tags: attrs.tags,
      viewEventsStatus: attrs.viewEventsStatus,
      viewConnectionsStatus: attrs.viewConnectionsStatus,
      viewGroupsStatus: attrs.viewGroupsStatus,
      viewTagsStatus: attrs.viewTagsStatus,
      viewProfileImage: attrs.viewProfileImage,
      viewBioStatus: attrs.viewBioStatus,
      aboutMeStatus: attrs.aboutMeStatus,
      role: attrs.role,
    };
    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    try {
      // Update scalar fields using query builder
      await this.repo
        .createQueryBuilder()
        .update(User)
        .set(updateData)
        .where('id = :id', { id })
        .execute();
      console.log('User scalar fields updated successfully');
      // Update events relationship separately if provided
      if (attrs.events !== undefined) {
        await this.repo
          .createQueryBuilder()
          .relation(User, 'events')
          .of(id)
          .set(attrs.events);
        console.log('User events updated successfully');
      }
    } catch (error: any) {
      // Use 'any' for now, or define a custom error type
      console.error(
        'Error updating user:',
        error?.message || String(error),
        error?.stack || '',
      );
      if (error?.code === '23505') {
        throw new BadRequestException('Email already exists');
      }
      if (error?.code === '23502' && error?.column === 'userId') {
        throw new BadRequestException(
          'Invalid notification data: userId cannot be null',
        );
      }
      throw new InternalServerErrorException(
        `Failed to update user: ${error?.message || String(error)}`,
      );
    }
    const updatedUser = await this.repo.findOne({
      where: { id },
      loadRelationIds: true,
    });
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found after update`);
    }
    console.log(
      'Returning updated user:',
      JSON.stringify(updatedUser, null, 2),
    );
    return updatedUser;
  }

  async removeUser(id: number) {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.repo.remove(user);
  }
}
