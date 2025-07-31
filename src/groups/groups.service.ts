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
import { GroupDto } from './dtos/group.dto';

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
      relations: ['adminGroups'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const group = this.groupRepository.create({
      ...createGroupDto,
      groupAdmins: [user],
    });

    const newGroup = await this.groupRepository.save(group);

    user.adminGroups.push(newGroup);
    await this.userRepository.save(user);

    return await this.groupRepository.findOne({
      where: { id: newGroup.id },
      relations: ['groupAdmins'],
      loadRelationIds: true,
    });
  }

  async findAllGroups(pagination: {
    limit?: number;
    page?: number;
    category?: string;
    sortBy?: string;
    search?: string;
  }): Promise<any[]> {
    let { limit, page, category, sortBy, search } = pagination;

    limit = limit || 15;
    page = page || 1;

    if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
      throw new BadRequestException('Limit and page must be positive numbers');
    }

    const skip = (page - 1) * limit;

    const query = this.groupRepository
      .createQueryBuilder('grp')
      .leftJoin('grp.members', 'member')
      .select([
        'grp.id',
        'grp.name',
        'grp.image',
        'grp.description',
        'grp.openAccess',
        'grp.location',
        'grp.creationDate',
        'grp.category',
      ])
      .addSelect('ARRAY_AGG(member.id)', 'members')
      .where('grp.approved = :approved', { approved: true })
      .groupBy('grp.id');

    if (category) {
      query.andWhere('grp.category = :category', { category });
    }

    if (search && search.trim() !== '') {
      const tsSearch = search.trim().replace(/'/g, "''");

      query.andWhere(
        `(
        to_tsvector('english', grp.name) @@ plainto_tsquery('english', :tsSearch)
        OR EXISTS (
          SELECT 1 FROM unnest(grp.description) elem
          WHERE to_tsvector('english', elem) @@ plainto_tsquery('english', :tsSearch)
        )
      )`,
        { tsSearch },
      );
    }

    if (sortBy) {
      switch (sortBy.toLowerCase()) {
        case 'latest':
          query.orderBy('grp.creationDate', 'DESC');
          break;
        case 'popular':
          query.orderBy(
            `(SELECT COUNT(*) FROM group_members_member gm WHERE gm."groupId" = grp.id)`,
            'DESC',
          );
          break;
        default:
          query.orderBy('grp.creationDate', 'ASC');
          break;
      }
    } else {
      query.orderBy('grp.creationDate', 'ASC');
    }

    query.skip(skip).take(limit);

    const raw = await query.getRawMany();

    return raw.map((row) => ({
      id: row.grp_id,
      name: row.grp_name,
      image: row.grp_image,
      description: row.grp_description,
      openAccess: row.grp_openAccess,
      location: row.grp_location,
      creationDate: row.grp_creationDate,
      category: row.grp_category,
      members: row.members ? row.members.filter((id) => id !== null) : [],
    }));
  }

  async findGroupById(id: number): Promise<GroupDto> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['events', 'groupAdmins', 'members'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return {
      ...group,
      events: group.events.map((event) => event.id),
      members: group.members.map((member) => member.id),
      groupAdmins: group.groupAdmins,
    };
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
      .leftJoin('event.attendees', 'attendees')
      .loadRelationIdAndMap('event.attendees', 'event.attendees')
      .where('group.id = :groupId', { groupId })
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
