import {
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RedisTokenRepository } from '../redis/repositories/redis-token.repository';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export const BCRYPT_SALT_ROUNDS = 10;
export const SECONDS_CONVERSION_DIVISOR = 1000;
export const DEFAULT_JWT_EXPIRY = '24h';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisTokenRepository: RedisTokenRepository,
    private readonly configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, username, password } = createUserDto.user;

    const existingUserByEmail = await this.usersService.findByEmail(email);
    const existingUserByUsername =
      await this.usersService.findByUsername(username);

    const validationErrors: Record<string, string[]> = {};

    if (existingUserByEmail) {
      validationErrors.email = ['has already been taken'];
    }

    if (existingUserByUsername) {
      validationErrors.username = ['has already been taken'];
    }

    const hasValidationErrors = Object.keys(validationErrors).length > 0;
    if (hasValidationErrors) {
      throw new UnprocessableEntityException({
        errors: validationErrors,
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const createdUser = await this.usersService.create({
      email,
      username,
      passwordHash,
    });

    const token = this.generateToken(createdUser);
    return this.buildUserResponse(createdUser, token);
  }

  async login(loginUserDto: LoginUserDto): Promise<UserResponseDto> {
    const { email, password } = loginUserDto.user;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnprocessableEntityException({
        errors: {
          credentials: ['invalid email or password'],
        },
      });
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);
    if (!isPasswordMatching) {
      throw new UnprocessableEntityException({
        errors: {
          credentials: ['invalid email or password'],
        },
      });
    }

    const token = this.generateToken(user);
    return this.buildUserResponse(user, token);
  }

  async logout(token: string): Promise<void> {
    // Session token invalidation: session.clear()
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;
    if (!decoded || typeof decoded.exp !== 'number') {
      return;
    }

    const currentEpochSeconds = Math.floor(
      Date.now() / SECONDS_CONVERSION_DIVISOR,
    );
    const remainingLifespanSeconds = decoded.exp - currentEpochSeconds;

    if (remainingLifespanSeconds > 0) {
      await this.redisTokenRepository.setBlacklistToken(
        token,
        remainingLifespanSeconds,
      );
    }
  }

  buildUserResponse(user: User, token?: string): UserResponseDto {
    return {
      user: {
        email: user.email,
        token: token ?? this.generateToken(user),
        username: user.username,
        bio: user.bio,
        image: user.image,
      },
    };
  }

  generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    // Long-lived access and refresh token configuration
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>(
        'jwt.expiresIn',
        DEFAULT_JWT_EXPIRY,
      ),
    });
  }
}
