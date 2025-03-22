import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Response } from 'express';
import { ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import { CreateUserDto } from './dtos/create-user-dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let fakeUserService: {
    findUsersWithEmail: jest.Mock;
    findUserByEmail: jest.Mock;
    createUser: jest.Mock;
    findUserByGoogleId: jest.Mock;
  };

  let fakeUserRepository: Partial<Repository<User>>;
  let fakeJwtService: Partial<JwtService>;

  const mockResponse = {
    cookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn(),
    links: jest.fn(),
    type: jest.fn(),
    header: jest.fn(),
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    end: jest.fn(),
    jsonp: jest.fn(),
  } as unknown as Response<any, Record<string, any>>;

  beforeEach(async () => {
    fakeJwtService = {
      signAsync: jest.fn().mockResolvedValue('mocked-jwt-token'),
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
      verify: jest.fn(),
    };

    fakeUserRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockResolvedValue({
        id: 1,
        username: 'testUser',
        email: 'testUser@test.com',
        password: 'Password1#',
      } as User),
    };

    fakeUserService = {
      findUsersWithEmail: jest.fn().mockResolvedValue([]),
      findUserByEmail: jest.fn().mockResolvedValue({
        id: 1,
        username: 'testUser',
        email: 'testUser@test.com',
        password: 'Password1#',
      } as User),
      findUserByGoogleId: jest.fn().mockResolvedValue({
        id: 1,
        username: 'Test User',
        email: 'testuser@example.com',
        googleId: '123456',
        authMethod: 'google',
        profileImage: 'profile.jpg',
      } as User),
      createUser: jest
        .fn()
        .mockImplementation(
          (username: string, email: string, password: string) =>
            Promise.resolve({
              id: 1,
              username,
              email,
              password,
            } as User),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUserService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: fakeUserRepository,
        },
        {
          provide: JwtService,
          useValue: fakeJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('Auth service should be defined', () => {
    expect(service).toBeDefined();
  });

  // SIGN UP

  it('Creates a new user with a salted and hashed password and sets the cookie', async () => {
    const createUserDto = {
      username: 'testUser',
      email: 'testUser@test.com',
      password: 'Password1#',
    };

    const mockSalt = 'someRandomSalt';
    const mockHash = '$2b$10$' + mockSalt + '$hashedPassword';

    (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
    (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

    const user = await service.signUp(
      createUserDto.username,
      createUserDto.email,
      createUserDto.password,
      mockResponse,
    );

    const [salt, hash] = user.password.split('$2b$10$');

    expect(user.password).not.toEqual(createUserDto.password);
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
    expect(user.username).toEqual(createUserDto.username);
    expect(user.email).toEqual(createUserDto.email);

    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24,
      }),
    );
  });

  it('Should throw a ConflictException error if the email is already in use', async () => {
    const createUserDto = {
      username: 'testUser',
      email: 'testUser@test.com',
      password: 'Password1#',
    };

    const mockExistingUser: User[] = [
      {
        id: 1,
        username: 'testUser',
        email: 'testUser@test.com',
        password: 'Password1#',
        googleId: '',
        authMethod: 'email',
        profileBackgroundImage: '',
        profileImage: '',
        aboutMe: '',
        bio: '',
        viewEventsStatus: 'public',
        viewConnectionsStatus: 'public',
        viewGroupsStatus: 'public',
        viewTagsStatus: 'public',
        viewProfileImage: 'public',
        viewBioStatus: 'public',
        aboutMeStatus: 'public',
        role: 'user',
        tags: [],
        adminGroups: [],
        groups: [],
        events: [],
        connections: [],
        sentConnections: [],
        comments: [],
        likes: [],
        notifications: [],
        receivedConnections: [],
        sentMessages: [],
        receivedMessages: [],
      },
    ];

    fakeUserService.findUsersWithEmail.mockResolvedValue(mockExistingUser);

    await expect(
      service.signUp(
        createUserDto.username,
        createUserDto.email,
        createUserDto.password,
        mockResponse,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should pass validation if password is valid', async () => {
    const createUserDto = {
      username: 'validUser',
      email: 'validuser@example.com',
      password: 'StrongPass123!',
    };

    const errors = await validate(createUserDto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation if password is too short', async () => {
    const dto = new CreateUserDto();
    dto.username = 'validUser';
    dto.email = 'validuser@example.com';
    dto.password = 'short';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation if password does not have an uppercase letter', async () => {
    const dto = new CreateUserDto();
    dto.username = 'noUppercaseUser';
    dto.email = 'noUppercaseuser@example.com';
    dto.password = 'nouppercase123!';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation if password does not have a special character', async () => {
    const dto = new CreateUserDto();
    dto.username = 'noSpecialCharUser';
    dto.email = 'nospecialcharuser@example.com';
    dto.password = 'NoSpecialChar123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation if password exceeds maximum length', async () => {
    const dto = new CreateUserDto();
    dto.username = 'longPasswordUser';
    dto.email = 'longpassworduser@example.com';
    dto.password = 'ThisIsAReallyLongPassword123!';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation if email is invalid', async () => {
    const dto = new CreateUserDto();
    dto.username = 'validUser';
    dto.email = 'invalid-email';
    dto.password = 'Password1#';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints.isEmail).toBe('Invalid email format');
  });

  it('should pass validation if username is valid', async () => {
    const dto = new CreateUserDto();
    dto.username = 'validUser';
    dto.email = 'validuser@example.com';
    dto.password = 'StrongPass123!';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation if username is too short', async () => {
    const dto = new CreateUserDto();
    dto.username = 'a';
    dto.email = 'validuser@example.com';
    dto.password = 'Password1#';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints.minLength).toBe(
      'Username must be at least 2 characters long',
    );
  });

  it('should fail validation if username is too long', async () => {
    const dto = new CreateUserDto();
    dto.username = 'ThisIsAVeryLongUsernameThatShouldFailValidation';
    dto.email = 'validuser@example.com';
    dto.password = 'Password1#';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints.maxLength).toBe(
      'Username must not exceed 20 characters',
    );
  });

  // SIGN IN
  it('should successfully sign in a user and set a cookie', async () => {
    const email = 'testUser@test.com';
    const password = 'Password1#';

    const mockUser = {
      id: 1,
      username: 'testUser',
      email: 'testUser@test.com',
      profileBackgroundImage: '',
      profileImage: '',
      aboutMe: '',
      bio: '',
      password: 'hashedPassword1',
      googleId: '',
      authMethod: 'email',
      role: 'user',
      tags: [],
      viewEventsStatus: 'public',
      viewConnectionsStatus: 'public',
      viewGroupsStatus: 'public',
      viewTagsStatus: 'public',
      viewProfileImage: 'public',
      viewBioStatus: 'public',
      aboutMeStatus: 'public',
      adminGroups: [],
      events: [],
      connections: [],
      sentConnections: [],
      receivedConnections: [],
      sentMessages: [],
      receivedMessages: [],
      likes: [],
      notifications: [],
      groups: [],
      comments: [],
    };

    fakeUserService.findUserByEmail = jest.fn().mockResolvedValue(mockUser);

    jest.spyOn(service, 'comparePassword').mockResolvedValue(true);

    jest.spyOn(service, 'assignToken').mockResolvedValue('mockToken');

    jest
      .spyOn(service['userRepository'], 'findOne')
      .mockResolvedValue(mockUser);

    const mockResponse = {
      cookie: jest.fn(),
    } as unknown as Response;

    const result = await service.signIn(email, password, mockResponse);

    expect(result).not.toBeUndefined();
    expect(result).toEqual(mockUser);
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'token',
      'mockToken',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24,
      }),
    );
  });

  it('should throw NotFoundException if user is not found', async () => {
    const email = 'nonExistentUser@test.com';
    const password = 'password123';

    fakeUserService.findUserByEmail.mockResolvedValue(null);

    await expect(
      service.signIn(email, password, mockResponse),
    ).rejects.toThrowError('User not found');
  });

  it('should throw UnauthorizedException if password is invalid', async () => {
    const email = 'testUser@test.com';
    const password = 'wrongPassword';
    const mockUser = {
      id: 1,
      email: 'testUser@test.com',
      password: 'hashedPassword',
    };

    fakeUserService.findUserByEmail.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.signIn(email, password, mockResponse),
    ).rejects.toThrowError('Invalid password');
  });

  it('should throw ForbiddenException if no token is generated', async () => {
    const email = 'testUser@test.com';
    const password = 'password123';
    const mockUser = {
      id: 1,
      email: 'testUser@test.com',
      password: 'hashedPassword',
    };

    fakeUserService.findUserByEmail.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jest.spyOn(service, 'assignToken').mockResolvedValue(null);

    await expect(
      service.signIn(email, password, mockResponse),
    ).rejects.toThrowError('No access token');
  });

  it('should call assignToken with correct user data', async () => {
    const email = 'testUser@test.com';
    const password = 'password123';
    const mockUser = {
      id: 1,
      email: 'testUser@test.com',
      password: 'hashedPassword',
    };

    fakeUserService.findUserByEmail.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const assignTokenSpy = jest
      .spyOn(service, 'assignToken')
      .mockResolvedValue('mocked-jwt-token');

    await service.signIn(email, password, mockResponse);

    expect(assignTokenSpy).toHaveBeenCalledWith({
      id: mockUser.id,
      email: mockUser.email,
    });
  });

  // SIGNOUT

  it('should successfully log out a user and clear the token cookie', async () => {
    const mockRequest = {} as Request;
    const mockResponse = {
      clearCookie: jest.fn(),
      send: jest.fn().mockReturnValue({ message: 'Logged out successfully' }),
    } as unknown as Response;

    await service.signout(mockRequest, mockResponse);

    expect(mockResponse.clearCookie).toHaveBeenCalledWith('token');

    expect(mockResponse.send).toHaveBeenCalledWith({
      message: 'Logged out successfully',
    });
  });

  //GOOGLE VALIDATION

  it('should return the existing user and token if the user is found', async () => {
    const googleUser = {
      googleId: '123456',
      displayName: 'Test User',
      email: 'testuser@example.com',
      photos: [{ value: 'profile.jpg' }],
    };

    const mockUser = {
      id: 1,
      username: 'Test User',
      email: 'testuser@example.com',
      googleId: '123456',
      authMethod: 'google',
      profileImage: 'profile.jpg',
    };

    fakeUserService.findUserByGoogleId.mockResolvedValue(mockUser);

    jest.spyOn(fakeJwtService, 'sign').mockReturnValue('mockToken'); 


    const result = await service.validateGoogleUser(googleUser);

    expect(result).toEqual({
      user: mockUser,
      token: 'mockToken',
    });
    expect(fakeUserService.findUserByGoogleId).toHaveBeenCalledWith(
      googleUser.googleId,
    );
    expect(fakeJwtService.sign).toHaveBeenCalledWith({ userId: mockUser.id });
  });
});
