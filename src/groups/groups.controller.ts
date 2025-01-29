import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { GroupsService } from './groups.service';

import { Group } from 'src/entities/group.entity';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { CreateGroupDto } from './dtos/create-group-dto';
import { Request } from 'express';
import { User } from 'src/entities/user.entity';

export interface AuthenticatedUser {
  id: number;
  email: string;
}

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @Req() req: { user: User },
  ): Promise<Group> {
    const userId = req.user.id;
    return this.groupsService.createGroup(createGroupDto, userId);
  }

  @Get()
  async getAllGroups(): Promise<Group[]> {
    return this.groupsService.getAllGroups();
  }

  @Get('/:id')
  async getGroupById(@Param('id', ParseIntPipe) id: number): Promise<Group> {
    return this.groupsService.getGroupById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:groupId/join')
  async addUserToGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ): Promise<string> {
    const user = req.user as AuthenticatedUser;
    await this.groupsService.addUserToGroup(groupId, user.id);
    return `User ${user.id} successfully joined group ${groupId}`;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:groupId/leave')
  async leaveGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ): Promise<string> {
    const user = req.user as AuthenticatedUser;
    await this.groupsService.leaveGroup(groupId, user.id);
    return `User ${user.id} successfully left group ${groupId}`;
  }
}
