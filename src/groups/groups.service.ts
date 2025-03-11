import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from 'src/entities/group.entity';

import { User } from 'src/entities/user.entity';
import { CreateGroupDto } from './dtos/create-group-dto';
import { AppEvent } from 'src/entities/event.entity';

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
      loadRelationIds: true,
    });
  }

  async findAllGroups(): Promise<Group[]> {
    const groups = await this.groupRepository.find({
      loadRelationIds: true,
    });

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

    // ✅ Add user object to the members array
    group.members.push(user);

    // ✅ Save the updated group directly
    await this.groupRepository.save(group);

    // ✅ Reload group with only relation IDs to return
    return await this.groupRepository.findOne({
      where: { id: group.id },
      loadRelationIds: true, // Returns only IDs for relations
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
