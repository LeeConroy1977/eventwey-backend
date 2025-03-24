import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

import { ExecutionContext } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from './jwt.guard';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signout: jest.fn(),
    validateGoogleUser: jest.fn(),
  };

  const mockUsersService = {
    findUserById: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = req.user || null;
      return !!req.user;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('whoAmI', () => {
    it('should return the user when authenticated', async () => {
      const mockUser = {
        id: 1,
        username: 'Test User',
        email: 'test@example.com',
        googleId: '123456',
      };
      const mockRequest = { user: mockUser } as any;

      mockUsersService.findUserById.mockResolvedValue(mockUser);

      const result = await authController.whoAmI(mockRequest);
      expect(result).toEqual(mockUser);
      expect(usersService.findUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw an error if user is not authenticated', async () => {
      const mockRequest = { user: null } as any;

      await expect(async () =>
        authController.whoAmI(mockRequest),
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('signUp', () => {
    it('should call authService.signUp and return a user', async () => {
      const mockUser = { id: 1, username: 'NewUser', email: 'new@example.com' };
      const mockResponse = {} as Response;
      mockAuthService.signUp.mockResolvedValue(mockUser);

      const result = await authController.signUp(
        {
          username: 'NewUser',
          email: 'new@example.com',
          password: 'securepass',
        },
        mockResponse,
      );

      expect(result).toEqual(mockUser);
      expect(authService.signUp).toHaveBeenCalledWith(
        'NewUser',
        'new@example.com',
        'securepass',
        mockResponse,
      );
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn and return a user', async () => {
      const mockUser = {
        id: 1,
        username: 'TestUser',
        email: 'test@example.com',
      };
      const mockResponse = {} as Response;
      mockAuthService.signIn.mockResolvedValue(mockUser);

      const result = await authController.signIn(
        { email: 'test@example.com', password: 'password123' },
        mockResponse,
      );

      expect(result).toEqual(mockUser);
      expect(authService.signIn).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        mockResponse,
      );
    });
  });

  describe('signout', () => {
    it('should call authService.signout', async () => {
      const mockRequest = {} as any;
      const mockResponse = {} as any;
      mockAuthService.signout.mockResolvedValue({ message: 'Logged out' });

      const result = await authController.signout(mockRequest, mockResponse);

      expect(result).toEqual({ message: 'Logged out' });
      expect(authService.signout).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
      );
    });
  });

  describe('googleAuthRedirect', () => {
    it('should validate the Google user and return user data', async () => {
      const mockUser = {
        id: 1,
        username: 'GoogleUser',
        email: 'google@example.com',
      };
      const mockToken = 'jwt_token';
      const mockRequest = {
        user: {
          googleId: '12345',
          email: 'google@example.com',
          username: 'GoogleUser',
        },
      } as any;
      const mockResponse = { json: jest.fn() } as any;

      mockAuthService.validateGoogleUser.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      await authController.googleAuthRedirect(mockRequest, mockResponse);

      expect(mockAuthService.validateGoogleUser).toHaveBeenCalledWith({
        googleId: '12345',
        email: 'google@example.com',
        username: 'GoogleUser',
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        token: mockToken,
        user: mockUser,
      });
    });
  });
});
