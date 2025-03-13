import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
  Req,
  Delete,
  Query,
} from '@nestjs/common';
import { GroupsService } from './groups.service';

import { Group } from 'src/entities/group.entity';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { CreateGroupDto } from './dtos/create-group-dto';
import { Request } from 'express';
import { User } from 'src/entities/user.entity';
import { AppEvent } from 'src/entities/event.entity';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { ResponseUserDto } from 'src/users/dtos/response-user-dto';

export interface AuthenticatedUser {
  id: number;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user: { id: number; username: string; email: string };
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
  async findAllGroups(
    @Query('limit') limit: string = '15', 
    @Query('page') page: string = '1', 
    @Query('category') category?: string,
    @Query('sortBy') sortBy?: string, 
  ) {
   
    const limitNumber =
      isNaN(Number(limit)) || Number(limit) <= 0 ? 15 : Number(limit);
    const pageNumber =
      isNaN(Number(page)) || Number(page) <= 0 ? 1 : Number(page);

    return this.groupsService.findAllGroups({
      category,
      sortBy,
      limit: limitNumber,
      page: pageNumber,
    });
  }

  @Get('/:id')
  async findGroupById(@Param('id', ParseIntPipe) id: number): Promise<Group> {
    return this.groupsService.findGroupById(id);
  }
  @Serialize(ResponseUserDto)
  @Get('/:groupId/members')
  async findGroupMembers(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<User[]> {
    return this.groupsService.findGroupMembers(groupId);
  }

  @Get('/:groupId/events')
  async findGroupEvents(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<AppEvent[]> {
    return this.groupsService.findGroupEvents(groupId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:groupId/join')
  async addUserToGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ): Promise<Group> {
    const user = req.user as AuthenticatedUser;
    const group = await this.groupsService.addUserToGroup(groupId, user.id);
    return group;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:groupId/leave')
  async leaveGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ): Promise<Group> {
    const user = req.user as AuthenticatedUser;
    const group = await this.groupsService.leaveGroup(groupId, user.id);
    return group;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':groupId')
  async deleteGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.groupsService.deleteGroup(groupId, user.id);
  }
}
