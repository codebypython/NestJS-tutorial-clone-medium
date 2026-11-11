import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/entities/user.entity';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let service: ProfilesService;

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

  const mockProfileResponse: ProfileResponseDto = {
    profile: {
      username: 'TargetUser',
      bio: 'Target bio',
      image: 'https://example.com/target.jpg',
      following: false,
    },
  };

  const mockProfilesService = {
    getProfile: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: mockProfilesService,
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should delegate to profilesService.getProfile', async () => {
      mockProfilesService.getProfile.mockResolvedValue(mockProfileResponse);

      const result = await controller.getProfile('TargetUser', mockUser);

      expect(mockProfilesService.getProfile).toHaveBeenCalledWith(
        'TargetUser',
        mockUser,
      );
      expect(result).toEqual(mockProfileResponse);
    });
  });

  describe('followUser', () => {
    it('should delegate to profilesService.followUser', async () => {
      const followedResponse = {
        profile: { ...mockProfileResponse.profile, following: true },
      };
      mockProfilesService.followUser.mockResolvedValue(followedResponse);

      const result = await controller.followUser('TargetUser', mockUser);

      expect(mockProfilesService.followUser).toHaveBeenCalledWith(
        'TargetUser',
        mockUser,
      );
      expect(result).toEqual(followedResponse);
    });
  });

  describe('unfollowUser', () => {
    it('should delegate to profilesService.unfollowUser', async () => {
      const unfollowedResponse = {
        profile: { ...mockProfileResponse.profile, following: false },
      };
      mockProfilesService.unfollowUser.mockResolvedValue(unfollowedResponse);

      const result = await controller.unfollowUser('TargetUser', mockUser);

      expect(mockProfilesService.unfollowUser).toHaveBeenCalledWith(
        'TargetUser',
        mockUser,
      );
      expect(result).toEqual(unfollowedResponse);
    });
  });
});
