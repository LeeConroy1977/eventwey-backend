import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../entities/group.entity';

import { User } from '../entities/user.entity';
import { CreateGroupDto } from './dtos/create-group-dto';
import { AppEvent } from '../entities/event.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AppEvent)
    private readonly eventRepository: Repository<AppEvent>,
  ) {}

  async createGroup(
    createGroupDto: CreateGroupDto,
    userId: number,
  ): Promise<Group> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['groups', 'events', 'adminGroups'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const group = this.groupRepository.create({
      ...createGroupDto,
      groupAdmins: [user],
    });

    const newGroup = await this.groupRepository.save(group);

    return await this.groupRepository.findOne({
      where: { id: newGroup.id },
      relations: ['groupAdmins'],
      loadRelationIds: true,
    });
  }

  async findAllGroups(pagination: {
    limit: number;
    page: number;
    category?: string;
    sortBy?: string;
  }): Promise<Group[]> {
    let { limit, page, category, sortBy } = pagination;

    limit = limit || 15;
    page = page || 1;

    const skip = (page - 1) * limit;

    const queryOptions: any = {
      skip: skip,
      take: limit,
      loadRelationIds: true,
    };

    if (category) {
      queryOptions.where = { category };
    }

    if (sortBy) {
      switch (sortBy) {
        case 'latest':
          queryOptions.order = { createdAt: 'DESC' };
          break;
        case 'popular':
          queryOptions.order = { usersCount: 'DESC' };
          break;
        case 'alphabetical':
          queryOptions.order = { name: 'ASC' };
          break;
        default:
          break;
      }
    }

    const groups = await this.groupRepository.find(queryOptions);

    return groups;
  }

  async findGroupById(id: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      loadRelationIds: true,
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async findGroupMembers(groupId: number) {
    const group = await this.findGroupById(groupId);

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const members = await this.userRepository.find({
      where: {
        groups: { id: groupId },
      },
      loadRelationIds: true,
    });

    return members;
  }

  async findGroupEvents(groupId: number) {
    const group = await this.findGroupById(groupId);

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }
    const events = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.group', 'group')
      .where('group.id = :groupId', { groupId })
      .loadAllRelationIds()
      .getMany();

    return events;
  }

  async updateGroup(
    groupId: number,
    updateData: Partial<Group>,
  ): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['groupAdmins', 'events', 'members'],
    });

    if (!group) {
      throw new NotFoundException(`Event with ID ${groupId} not found`);
    }

    Object.assign(group, updateData);

    return this.groupRepository.save(group);
  }

  async addUserToGroup(groupId: number, userId: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['groupAdmins', 'events', 'members'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (group.members.some((member) => member.id === userId)) {
      throw new BadRequestException('User is already a member of this group');
    }

    group.members.push(user);

    await this.groupRepository.save(group);

    return await this.groupRepository.findOne({
      where: { id: group.id },
      loadRelationIds: true,
    });
  }

  async leaveGroup(groupId: number, userId: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['groupAdmins', 'events', 'members'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const userExists = group.members.some((member) => member.id === userId);
    if (!userExists) {
      throw new NotFoundException('User not found in group members');
    }

    group.members = group.members.filter((member) => member.id !== userId);

    const updateData: Partial<Group> = {
      members: group.members,
    };

    const updatedGroup = await this.updateGroup(groupId, updateData);

    return await this.groupRepository.findOne({
      where: { id: updatedGroup.id },
      loadRelationIds: true,
    });
  }

  async deleteGroup(
    groupId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['events', 'members', 'groupAdmins'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const isAdmin = group.groupAdmins.some((admin) => admin.id === userId);

    if (!isAdmin) {
      throw new ForbiddenException(
        `You do not have permission to delete this group`,
      );
    }

    await this.groupRepository.delete(groupId);

    return { message: `Group ${groupId} has been successfully deleted` };
  }
}
