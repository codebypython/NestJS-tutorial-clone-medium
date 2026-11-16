import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import {
  extractDatabaseErrorMessage,
  isDuplicateEntryError,
} from '../../common/utils/database-error.util';
import { User } from './entities/user.entity';

export const BCRYPT_SALT_ROUNDS = 10;

export interface CreateUserData {
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

export interface UpdateUserData {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  async create(userData: CreateUserData): Promise<User> {
    const newUser = this.userRepository.create({
      email: userData.email,
      username: userData.username,
      password: userData.passwordHash,
      bio: userData.bio ?? null,
      image: userData.image ?? null,
    });
    return this.userRepository.save(newUser);
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async update(id: string, updateData: UpdateUserData): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException({
        errors: { user: ['user not found'] },
      });
    }

    const validationErrors: Record<string, string[]> = {};

    if (updateData.email !== undefined) {
      const normalizedEmail = updateData.email.toLowerCase().trim();
      if (normalizedEmail !== user.email) {
        const existingByEmail = await this.findByEmail(normalizedEmail);
        if (existingByEmail && existingByEmail.id !== id) {
          validationErrors.email = ['has already been taken'];
        } else {
          user.email = normalizedEmail;
        }
      }
    }

    if (updateData.username !== undefined) {
      const normalizedUsername = updateData.username.trim();
      if (normalizedUsername !== user.username) {
        const existingByUsername = await this.findByUsername(normalizedUsername);
        if (existingByUsername && existingByUsername.id !== id) {
          validationErrors.username = ['has already been taken'];
        } else {
          user.username = normalizedUsername;
        }
      }
    }

    const hasValidationErrors = Object.keys(validationErrors).length > 0;
    if (hasValidationErrors) {
      throw new UnprocessableEntityException({
        errors: validationErrors,
      });
    }

    if (updateData.password !== undefined) {
      user.password = await bcrypt.hash(updateData.password, BCRYPT_SALT_ROUNDS);
    }

    if (updateData.bio !== undefined) {
      user.bio = updateData.bio;
    }

    if (updateData.image !== undefined) {
      user.image = updateData.image;
    }

    try {
      return await this.userRepository.save(user);
    } catch (err: unknown) {
      if (isDuplicateEntryError(err)) {
        const fullMessage = extractDatabaseErrorMessage(err);
        const isEmailConflict = fullMessage.includes('IDX_users_email');
        const isUsernameConflict = fullMessage.includes('IDX_users_username');

        const conflictErrors: Record<string, string[]> = {};
        if (isEmailConflict) {
          conflictErrors.email = ['has already been taken'];
        }
        if (isUsernameConflict) {
          conflictErrors.username = ['has already been taken'];
        }
        if (Object.keys(conflictErrors).length === 0) {
          conflictErrors.user = ['already exists'];
        }

        Logger.warn(
          {
            message:
              'Database duplicate constraint conflict handled and mapped to HTTP 422',
            explanation:
              'A unique index collision occurred during user update',
            guidance:
              'The request was rejected with HTTP 422 Unprocessable Entity for client resolution',
          },
          'UsersService',
        );

        throw new UnprocessableEntityException({
          errors: conflictErrors,
        });
      }

      const fatalError = err instanceof Error ? err : new Error(String(err));
      Logger.error(
        {
          message: 'Unhandled database error during user update',
          explanation:
            'Database update failed due to connection or schema issue',
          guidance: 'Verify database connectivity and check database health',
          errorName: fatalError.name,
          errorMessage: fatalError.message,
          rawError: fatalError,
        },
        'UsersService',
      );
      throw new InternalServerErrorException({
        message: 'Database persistence failed due to an internal server error',
        explanation:
          'The system encountered an unhandled error during user update',
        guidance: 'Check database connectivity and server logs',
      });
    }
  }
}
