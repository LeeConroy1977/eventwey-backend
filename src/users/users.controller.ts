import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
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
    console.log('Authenticated User:', req.user);

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
  async findUserEvents(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const events = await this.usersService.findUserEvents(id);

    return events;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id/admin-groups')
  async getAdminGroups(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const groups = await this.usersService.getAdminGroups(id);

    return groups.map((group) => ({ ...group }));
  }
}
