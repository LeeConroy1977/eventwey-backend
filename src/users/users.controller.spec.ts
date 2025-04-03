import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Notification } from '../entities/notification.entity';
import { UpdateUserDto } from './dtos/update-user-dto';

const mockUsersService = () => ({
  findAllUsers: jest.fn(),
  findUserById: jest.fn(),
  findUserEvents: jest.fn(),
  findUserGroups: jest.fn(),
  findAdminGroups: jest.fn(),
  findUserConnections: jest.fn(),
  findUserNotifications: jest.fn(),
  updateUser: jest.fn(),
  removeUser: jest.fn(),
});

const mockAuthService = () => ({});

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService() },
        { provide: AuthService, useValue: mockAuthService() },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllUsers', () => {
    it('should return an array of users', async () => {
      const result = [{ id: 1, username: 'testuser' }];
      (usersService.findAllUsers as jest.Mock).mockResolvedValue(result);

      expect(await controller.findAllUsers()).toEqual(result);
    });
  });

  describe('findUserById', () => {
    it('should return a user if found', async () => {
      const user = { id: 1, username: 'testuser' } as User;
      const req = { user: { id: 1 } } as any;

      (usersService.findUserById as jest.Mock).mockResolvedValue(user);

      expect(await controller.findUserById(1, req)).toEqual(user);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null } as any;

      await expect(controller.findUserById(1, req)).rejects.toThrowError(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException if the user is not the same as the requested user', async () => {
      const req = { user: { id: 2 } } as any;

      await expect(controller.findUserById(1, req)).rejects.toThrowError(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      const req = { user: { id: 1 } } as any;

      (usersService.findUserById as jest.Mock).mockResolvedValue(null);

      await expect(controller.findUserById(1, req)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('findUserEvents', () => {
    it('should return an array of events for the user', async () => {
      const events = [{ id: 1, title: 'Event 1' }];
      (usersService.findUserEvents as jest.Mock).mockResolvedValue(events);

      expect(await controller.findUserEvents(1, {})).toEqual(events);
    });
  });

  describe('findUserGroups', () => {
    it('should return an array of groups for the user', async () => {
      const groups = [{ id: 1, name: 'Group 1' }];
      (usersService.findUserGroups as jest.Mock).mockResolvedValue(groups);

      expect(await controller.findUserGroups(1)).toEqual(groups);
    });
  });

  describe('findAdminGroups', () => {
    it('should return an array of admin groups for the user', async () => {
      const groups = [{ id: 1, name: 'Admin Group 1' }];
      (usersService.findAdminGroups as jest.Mock).mockResolvedValue(groups);

      expect(await controller.findAdminGroups(1)).toEqual(groups);
    });
  });

  describe('findUserConnections', () => {
    it('should return an array of user connections', async () => {
      const connections = [{ id: 1, username: 'testuser' }];
      (usersService.findUserConnections as jest.Mock).mockResolvedValue(
        connections,
      );

      expect(await controller.findUserConnections(1)).toEqual(connections);
    });
  });

  describe('findUserNotifications', () => {
    it('should return an array of notifications', async () => {
      const notifications = [
        { id: 1, message: 'New Notification' },
      ] as Notification[];
      (usersService.findUserNotifications as jest.Mock).mockResolvedValue(
        notifications,
      );

      expect(await controller.findUserNotifications(1)).toEqual(notifications);
    });
  });

  describe('updateUser', () => {
    it('should update and return the updated user', async () => {
      const updateUserDto = { username: 'newUsername' } as UpdateUserDto;
      const updatedUser = { id: 1, username: 'newUsername' } as User;
      (usersService.updateUser as jest.Mock).mockResolvedValue(updatedUser);

      expect(await controller.updateUser(1, updateUserDto)).toEqual(
        updatedUser,
      );
    });
  });

  describe('removeUser', () => {
    it('should remove the user', async () => {
      const removedUser = { id: 1 } as User;
      (usersService.removeUser as jest.Mock).mockResolvedValue(removedUser);

      expect(await controller.removeUser(1)).toEqual(removedUser);
    });
  });
});
