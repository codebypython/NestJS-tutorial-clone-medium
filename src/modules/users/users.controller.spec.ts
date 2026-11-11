import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUser: User = {
    id: 'user-uuid-1234',
    email: 'jake@jake.jake',
    username: 'Jacob',
    password: '$2a$10$hashedpassword',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockUsersService = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(usersService).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return current user with token', () => {
      const mockRequest = {
        token: 'active-jwt-token-xyz',
      } as AuthenticatedRequest;

      const result = controller.getCurrentUser(mockUser, mockRequest);

      expect(result).toEqual({
        user: {
          email: mockUser.email,
          token: 'active-jwt-token-xyz',
          username: mockUser.username,
          bio: mockUser.bio,
          image: mockUser.image,
        },
      });
    });

    it('should throw UnauthorizedException when token is missing from request', () => {
      const mockRequest = {} as AuthenticatedRequest;

      expect(() => controller.getCurrentUser(mockUser, mockRequest)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateCurrentUser', () => {
    it('should update user and return updated profile with token', async () => {
      const updatedUser: User = {
        ...mockUser,
        username: 'NewJacob',
        bio: 'Updated bio',
      };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const mockRequest = {
        token: 'active-jwt-token-xyz',
      } as AuthenticatedRequest;

      const result = await controller.updateCurrentUser(
        mockUser,
        {
          user: {
            username: 'NewJacob',
            bio: 'Updated bio',
          },
        },
        mockRequest,
      );

      expect(mockUsersService.update).toHaveBeenCalledWith(mockUser.id, {
        username: 'NewJacob',
        bio: 'Updated bio',
      });
      expect(result).toEqual({
        user: {
          email: updatedUser.email,
          token: 'active-jwt-token-xyz',
          username: 'NewJacob',
          bio: 'Updated bio',
          image: updatedUser.image,
        },
      });
    });

    it('should handle undefined user object in DTO gracefully and pass empty object', async () => {
      mockUsersService.update.mockResolvedValue(mockUser);

      const mockRequest = {
        token: 'active-jwt-token-xyz',
      } as AuthenticatedRequest;

      const result = await controller.updateCurrentUser(
        mockUser,
        {},
        mockRequest,
      );

      expect(mockUsersService.update).toHaveBeenCalledWith(mockUser.id, {});
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException when token is missing during update', async () => {
      const mockRequest = {} as AuthenticatedRequest;

      await expect(
        controller.updateCurrentUser(
          mockUser,
          { user: { bio: 'New bio' } },
          mockRequest,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
