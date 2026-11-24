import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { isDuplicateEntryError } from '../../common/utils/database-error.util';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { Follow } from './entities/follow.entity';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  private async findTargetUser(username: string): Promise<User> {
    const cleanUsername = username?.trim();
    if (!cleanUsername) {
      throw new NotFoundException({
        errors: { user: ['user not found'] },
      });
    }

    const targetUser = await this.usersService.findByUsername(cleanUsername);
    if (!targetUser) {
      throw new NotFoundException({
        errors: { user: ['user not found'] },
      });
    }

    return targetUser;
  }

  async getProfile(
    username: string,
    currentUser?: User | null,
  ): Promise<ProfileResponseDto> {
    const targetUser = await this.findTargetUser(username);

    let isFollowing = false;
    if (currentUser?.id) {
      const followRecord = await this.followRepository.findOneBy({
        followerId: currentUser.id,
        followingId: targetUser.id,
      });
      isFollowing = Boolean(followRecord);
    }

    return {
      profile: {
        username: targetUser.username,
        bio: targetUser.bio,
        image: targetUser.image,
        following: isFollowing,
      },
    };
  }

  async findFollowingIds(
    followerId: string,
    authorIds: string[],
  ): Promise<Set<string>> {
    if (!followerId || !authorIds || authorIds.length === 0) {
      return new Set<string>();
    }

    const follows = await this.followRepository.find({
      where: {
        followerId,
        followingId: In(authorIds),
      },
      select: ['followingId'],
    });

    return new Set(follows.map((follow) => follow.followingId));
  }

  async followUser(
    username: string,
    currentUser: User,
  ): Promise<ProfileResponseDto> {
    const targetUser = await this.findTargetUser(username);

    const isSelfFollow = currentUser.id === targetUser.id;
    if (isSelfFollow) {
      throw new UnprocessableEntityException({
        errors: { user: ['cannot follow yourself'] },
      });
    }

    const existingFollow = await this.followRepository.findOneBy({
      followerId: currentUser.id,
      followingId: targetUser.id,
    });

    if (!existingFollow) {
      try {
        const newFollow = this.followRepository.create({
          followerId: currentUser.id,
          followingId: targetUser.id,
        });
        await this.followRepository.save(newFollow);
      } catch (saveErr: unknown) {
        if (isDuplicateEntryError(saveErr)) {
          Logger.warn(
            {
              message: 'Concurrent follow record creation caught',
              explanation: 'Duplicate entry prevented in race condition',
              guidance: 'Operation treated as idempotent follow',
              error: String(saveErr),
            },
            'ProfilesService',
          );
        } else {
          const fatalError =
            saveErr instanceof Error ? saveErr : new Error(String(saveErr));
          Logger.error(
            {
              message: 'Unhandled database error during follow persistence',
              explanation: 'Database insertion failed during follow operation',
              guidance: 'Verify database connectivity and check database health',
              errorName: fatalError.name,
              errorMessage: fatalError.message,
              rawError: fatalError,
            },
            'ProfilesService',
          );
          throw new InternalServerErrorException({
            message: 'Database persistence failed due to an internal server error',
            explanation:
              'The system encountered an unhandled error during follow operation',
            guidance: 'Check database connectivity and server logs',
          });
        }
      }
    }

    return {
      profile: {
        username: targetUser.username,
        bio: targetUser.bio,
        image: targetUser.image,
        following: true,
      },
    };
  }

  async unfollowUser(
    username: string,
    currentUser: User,
  ): Promise<ProfileResponseDto> {
    const targetUser = await this.findTargetUser(username);

    await this.followRepository.delete({
      followerId: currentUser.id,
      followingId: targetUser.id,
    });

    return {
      profile: {
        username: targetUser.username,
        bio: targetUser.bio,
        image: targetUser.image,
        following: false,
      },
    };
  }
}

