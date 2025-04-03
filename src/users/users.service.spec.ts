import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';
import { AppEvent } from '../entities/event.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

// Mock repository setup with typing
const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    loadAllRelationIds: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  })),
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
  let eventRepository: Repository<AppEvent>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository() },
        { provide: getRepositoryToken(Group), useValue: mockRepository() },
        { provide: getRepositoryToken(AppEvent), useValue: mockRepository() },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    groupRepository = module.get<Repository<Group>>(getRepositoryToken(Group));
    eventRepository = module.get<Repository<AppEvent>>(getRepositoryToken(AppEvent));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllUsers', () => {
    it('should return an array of users', async () => {
      const users = [{ id: 1, username: 'testuser' }];
      (userRepository.find as jest.Mock).mockResolvedValue(users); // Explicitly type-cast the mock

      expect(await service.findAllUsers()).toEqual(users);
    });
  });

  describe('findUserById', () => {
    it('should return a user if found', async () => {
      const user = { id: 1, username: 'testuser', comments: [] } as User;
      (userRepository.findOne as jest.Mock).mockResolvedValue(user);

      expect(await service.findUserById(1)).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findUserById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUser', () => {
    it('should create and return a user', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        password: 'hashed',
      };
      (userRepository.create as jest.Mock).mockReturnValue(user);
      (userRepository.save as jest.Mock).mockResolvedValue(user);

      expect(
        await service.createUser('testuser', 'test@test.com', 'hashed'),
      ).toEqual(user);
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user if found', async () => {
      const user = { id: 1, email: 'test@test.com' } as User;
      (userRepository.findOne as jest.Mock).mockResolvedValue(user);

      expect(await service.findUserByEmail('test@test.com')).toEqual(user);
    });
  });

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      const user = { id: 1, username: 'oldname' } as User;
      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (userRepository.save as jest.Mock).mockResolvedValue({ ...user, username: 'newname' });

      expect(await service.updateUser(1, { username: 'newname' })).toEqual({
        ...user,
        username: 'newname',
      });
    });
  });

  describe('removeUser', () => {
    it('should remove a user', async () => {
      const user = { id: 1 } as User;
      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (userRepository.remove as jest.Mock).mockResolvedValue(user);

      expect(await service.removeUser(1)).toEqual(user);
    });
  });
});
