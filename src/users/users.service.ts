import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Group } from 'src/entities/group.entity';
import { User } from 'src/entities/user.entity';
import { Notification } from 'src/entities/notification.entity';

import { AppEvent } from 'src/entities/event.entity';
import { EventsService } from 'src/events/events.service';
import { GroupsService } from 'src/groups/groups.service';
import { Repository } from 'typeorm';

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

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    return this.repo.findOne({ where: { googleId }, loadRelationIds: true });
  }

  async findUserConnections(id: number) {
    const connections = await this.repo.find({
      where: {
        connections: { id },
      },
      loadRelationIds: true,
    });
    return connections;
  }

  async findUserEvents(userId: number, filters: any): Promise<any[]> {
    const user = await this.repo.findOne({
      where: { id: userId },
      loadRelationIds: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build query
    const query = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.group', 'group')
      .leftJoin('event.attendees', 'attendee')
      .where('attendee.id = :userId', { userId })
      .loadAllRelationIds();

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
          startDate = today;
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'tomorrow':
          startDate = new Date(today);
          startDate.setDate(today.getDate() + 1);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'thisWeek':
          startDate = today;
          endDate = new Date(today);
          endDate.setDate(today.getDate() + (7 - today.getDay()));
          break;
        case 'nextWeek':
          startDate = new Date(today);
          startDate.setDate(today.getDate() + (7 - today.getDay()) + 1);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          break;
        case 'thisMonth':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          break;
        case 'nextMonth':
          startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
          break;
      }

      if (startDate && endDate) {
        query.andWhere('event.date BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      }
    }

    // Sorting
    if (filters.sort === 'oldest') {
      query.orderBy('event.date', 'ASC');
    } else if (filters.sort === 'newest') {
      query.orderBy('event.date', 'DESC');
    } else if (filters.sort === 'free') {
      query.andWhere('event.price = 0');
    }

    // Pagination
    const limit = filters.limit ? parseInt(filters.limit, 10) : 10;
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    query.skip((page - 1) * limit).take(limit);

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

  async updateUser(id: number, attrs: Partial<User>) {
    const user = await this.findUserById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, attrs);

    return await this.repo.findOne({
      where: { id },
      loadRelationIds: true,
    });
  }

  async removeUser(id: number) {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.repo.remove(user);
  }
}
