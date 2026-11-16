import {
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Follow } from './entities/follow.entity';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let usersService: UsersService;
  let followRepository: Repository<Follow>;

  const mockTargetUser: User = {
    id: 'target-uuid-1234',
    email: 'target@example.com',
    username: 'TargetUser',
    password: '$2a$10$hashedpassword',
    bio: 'Target bio',
    image: 'https://example.com/target.jpg',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockCurrentUser: User = {
    id: 'current-uuid-5678',
    email: 'current@example.com',
    username: 'CurrentUser',
    password: '$2a$10$hashedpassword',
    bio: 'Current bio',
    image: 'https://example.com/current.jpg',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockFollowRecord: Follow = {
    followerId: mockCurrentUser.id,
    followingId: mockTargetUser.id,
    follower: mockCurrentUser,
    following: mockTargetUser,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockUsersService = {
    findByUsername: jest.fn(),
  };

  const mockFollowRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: getRepositoryToken(Follow),
          useValue: mockFollowRepository,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    usersService = module.get<UsersService>(UsersService);
    followRepository = module.get<Repository<Follow>>(
      getRepositoryToken(Follow),
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(usersService).toBeDefined();
    expect(followRepository).toBeDefined();
  });

  describe('getProfile', () => {
    it('should throw NotFoundException when username is empty string or only whitespace', async () => {
      await expect(service.getProfile('   ', mockCurrentUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when target user is not found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(
        service.getProfile('nonexistent', mockCurrentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return profile with following=false when unauthenticated (no currentUser)', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockTargetUser);

      const result = await service.getProfile(mockTargetUser.username, null);

      expect(result).toEqual({
        profile: {
          username: mockTargetUser.username,
          bio: mockTargetUser.bio,
          image: mockTargetUser.image,
          following: false,
        },
      });
      expect(mockFollowRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('should return profile with following=false when currentUser does not follow targetUser', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockTargetUser);
      mockFollowRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getProfile(
        mockTargetUser.username,
        mockCurrentUser,
      );

      expect(mockFollowRepository.findOneBy).toHaveBeenCalledWith({
        followerId: mockCurrentUser.id,
        followingId: mockTargetUser.id,
      });
      expect(result.profile.following).toBe(false);
    });

    it('should return profile with following=true when currentUser follows targetUser', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockTargetUser);
      mockFollowRepository.findOneBy.mockResolvedValue(mockFollowRecord);

      const result = await service.getProfile(
        mockTargetUser.username,
        mockCurrentUser,
      );

      expect(result.profile.following).toBe(true);
    });
  });

  describe('followUser', () => {
    it('should throw NotFoundException when target user does not exist', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(
        service.followUser('nonexistent', mockCurrentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException when user attempts to follow themselves', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockCurrentUser);

      await expect(
        service.followUser(mockCurrentUser.username, mockCurrentUser),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should create follow record and return profile with following=true when not already followed', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockTargetUser);
      mockFollowRepository.findOneBy.mockResolvedValue(null);
      mockFollowRepository.create.mockReturnValue(mockFollowRecord);
      mockFollowRepository.save.mockResolvedValue(mockFollowRecord);

      const result = await service.followUser(
        mockTargetUser.username,
        mockCurrentUser,
      );

      expect(mockFollowRepository.create).toHaveBeenCalledWith({
        followerId: mockCurrentUser.id,
        followingId: mockTargetUser.id,
      });
      expect(mockFollowRepository.save).toHaveBeenCalledWith(mockFollowRecord);
      expect(result.profile.following).toBe(true);
    });

    it('should return profile with following=true without duplicate insert if already followed', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockTargetUser);
      mockFollowRepository.findOneBy.mockResolvedValue(mockFollowRecord);

      const result = await service.followUser(
        mockTargetUser.username,
        mockCurrentUser,
      );

      expect(mockFollowRepository.create).not.toHaveBeenCalled();
      expect(mockFollowRepository.save).not.toHaveBeenCalled();
      expect(result.profile.following).toBe(true);
    });

    it('should handle duplicate race condition error gracefully on save', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockTargetUser);
      mockFollowRepository.findOneBy.mockResolvedValue(null);
      mockFollowRepository.create.mockReturnValue(mockFollowRecord);
      mockFollowRepository.save.mockRejectedValue(new Error('ER_DUP_ENTRY'));

      const result = await service.followUser(
        mockTargetUser.username,
        mockCurrentUser,
      );

      expect(result.profile.following).toBe(true);
    });

    it('should throw InternalServerErrorException when save fails with fatal DB error', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockTargetUser);
      mockFollowRepository.findOneBy.mockResolvedValue(null);
      mockFollowRepository.create.mockReturnValue(mockFollowRecord);
      mockFollowRepository.save.mockRejectedValue(
        new Error('Fatal connection crash'),
      );

      await expect(
        service.followUser(mockTargetUser.username, mockCurrentUser),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('unfollowUser', () => {
    it('should throw NotFoundException when username is empty string or only whitespace', async () => {
      await expect(
        service.unfollowUser('   ', mockCurrentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when target user is not found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(
        service.unfollowUser('nonexistent', mockCurrentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete follow record and return profile with following=false', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockTargetUser);
      mockFollowRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.unfollowUser(
        mockTargetUser.username,
        mockCurrentUser,
      );

      expect(mockFollowRepository.delete).toHaveBeenCalledWith({
        followerId: mockCurrentUser.id,
        followingId: mockTargetUser.id,
      });
      expect(result.profile.following).toBe(false);
    });
  });
});
