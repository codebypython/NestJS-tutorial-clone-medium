import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { Follow } from './entities/follow.entity';

export const MYSQL_DUP_ENTRY_CODE = 'ER_DUP_ENTRY';
export const MYSQL_DUP_ENTRY_ERRNO = 1062;

@Injectable()
export class ProfilesService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  async getProfile(
    username: string,
    currentUser?: User | null,
  ): Promise<ProfileResponseDto> {
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

  async followUser(
    username: string,
    currentUser: User,
  ): Promise<ProfileResponseDto> {
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
        const errorObj = saveErr as {
          code?: string;
          errno?: number;
          message?: string;
          driverError?: { code?: string; errno?: number; message?: string };
        };

        const isDuplicateError =
          errorObj.code === MYSQL_DUP_ENTRY_CODE ||
          errorObj.errno === MYSQL_DUP_ENTRY_ERRNO ||
          errorObj.driverError?.code === MYSQL_DUP_ENTRY_CODE ||
          errorObj.driverError?.errno === MYSQL_DUP_ENTRY_ERRNO ||
          (typeof errorObj.message === 'string' &&
            (errorObj.message.includes('Duplicate entry') ||
              errorObj.message.includes('ER_DUP_ENTRY')));

        if (isDuplicateError) {
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

