import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from './users.service';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { Request, response } from 'express';
import { ResponseUserDto } from './dtos/response-user-dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Group } from 'src/entities/group.entity';
import { UserDto } from './dtos/user-dto';
import { UpdateUserDto } from './dtos/update-user-dto';
import { User } from 'src/entities/user.entity';
import { Notification } from 'src/entities/notification.entity';

interface AuthenticatedRequest extends Request {
  user: { id: number; username: string; email: string };
}

@Controller('users')
export class UsersController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Serialize(ResponseUserDto)
  @Get()
  findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Serialize(ResponseUserDto)
  @Get('/:id')
  async findUserById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('No authenticated user');
    }

    if (user.id !== id) {
      throw new ForbiddenException('You are not allowed to access this user');
    }

    const foundUser = await this.usersService.findUserById(id);
    if (!foundUser) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    return foundUser;
  }

  @Get('/:id/events')
  async findUserEvents(
    @Param('id', ParseIntPipe) id: number,
    @Query() filters: any,
  ): Promise<any> {
    const events = await this.usersService.findUserEvents(id, filters);
    return events;
  }

  @Get('/:id/groups')
  async findUserGroups(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const groups = await this.usersService.findUserGroups(id);

    return groups;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id/admin-groups')
  async findAdminGroups(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const groups = await this.usersService.findAdminGroups(id);

    return groups.map((group) => ({ ...group }));
  }

  @Get('/:id/connections')
  async findUserConnections(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User[]> {
    const connections = await this.usersService.findUserConnections(id);
    return connections;
  }

  @Get('/:id/notifications')
  async findUserNotifications(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Notification[]> {
    const notifications = await this.usersService.findUserNotifications(id);
    return notifications;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    const user = await this.usersService.updateUser(id, body);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async removeUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.removeUser(id);
    return user;
  }
}
