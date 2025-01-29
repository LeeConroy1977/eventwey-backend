import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from 'src/entities/group.entity';

import { User } from 'src/entities/user.entity';
import { CreateGroupDto } from './dtos/create-group-dto';
import { classToPlain, plainToClass, plainToInstance } from 'class-transformer';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createGroup(
    createGroupDto: CreateGroupDto,
    userId: number,
  ): Promise<Group> {
    // Find the user who will be the admin
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    // Create a new group and set the groupAdmins to the user
    const group = this.groupRepository.create({
      ...createGroupDto,
      groupAdmins: [user],
    });

    return this.groupRepository.save(group);
  }

  async getAllGroups(): Promise<Group[]> {
    const groups = await this.groupRepository.find({
      relations: ['groupAdmins', 'events', 'members'],
    });

    const transformedGroups = groups.map((group) =>
      plainToInstance(Group, group, { strategy: 'excludeAll' }),
    );

    return transformedGroups;
  }
  async getGroupById(id: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['groupAdmins', 'events', 'members'], // Load the groupAdmins relation
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    // Transform group to include only exposed fields
    return plainToInstance(Group, group, { strategy: 'excludeAll' });
  }

  async addUserToGroup(groupId: number, userId: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['groupAdmins', 'events', 'members'],
    });

    if (!group) {
      throw new NotFoundException(`Event with ID ${groupId} not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!group.members.some((member) => member.id === userId)) {
      group.members.push(user);
      await this.groupRepository.save(group);
    }

    return await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['groupAdmins', 'events', 'members'],
    });
  }

  async leaveGroup(groupId: number, userId: number) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['members'],
    });
    if (!group) {
      throw new Error('Group not found');
    }
    const userExists = group.members.some((member) => member.id === userId);
    if (!userExists) {
      throw new NotFoundException('User not found in event attendees');
    }

    group.members = group.members.filter((member) => member.id !== userId);

    await this.groupRepository.save(group);
  }
}
