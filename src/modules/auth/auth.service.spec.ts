import { UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { RedisTokenRepository } from '../redis/repositories/redis-token.repository';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findById: jest.Mock;
    findByEmail: jest.Mock;
    findByUsername: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
    decode: jest.Mock;
  };
  let redisTokenRepository: {
    setBlacklistToken: jest.Mock;
    isTokenBlacklisted: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };

  const mockUser: User = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'jake@jake.jake',
    username: 'Jacob',
    password: '$2a$10$hashedpasswordstringforsecuretesting123456',
    bio: 'Test bio description',
    image: 'https://example.com/avatar.jpg',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const sampleToken = 'mocked.jwt.token';

  beforeEach(async () => {
    usersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue(sampleToken),
      decode: jest.fn(),
    };

    redisTokenRepository = {
      setBlacklistToken: jest.fn().mockResolvedValue(undefined),
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    };

    configService = {
      get: jest.fn().mockReturnValue('24h'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisTokenRepository, useValue: redisTokenRepository },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully and return UserResponseDto', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(sampleToken);

      const registerDto = {
        user: {
          email: 'jake@jake.jake',
          username: 'Jacob',
          password: 'plainpassword123',
        },
      };

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.user.email);
      expect(usersService.findByUsername).toHaveBeenCalledWith(registerDto.user.username);
      expect(usersService.create).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          email: mockUser.email,
          token: sampleToken,
          username: mockUser.username,
          bio: mockUser.bio,
          image: mockUser.image,
        },
      });
    });

    it('should throw UnprocessableEntityException when email is already taken', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.findByUsername.mockResolvedValue(null);

      const registerDto = {
        user: {
          email: 'jake@jake.jake',
          username: 'NewUniqueUser',
          password: 'plainpassword123',
        },
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        UnprocessableEntityException,
      );

      try {
        await service.register(registerDto);
      } catch (err: unknown) {
        const error = err as UnprocessableEntityException;
        const response = error.getResponse() as { errors: Record<string, string[]> };
        expect(response.errors.email).toEqual(['has already been taken']);
      }
    });

    it('should throw UnprocessableEntityException when username is already taken', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(mockUser);

      const registerDto = {
        user: {
          email: 'newemail@test.com',
          username: 'Jacob',
          password: 'plainpassword123',
        },
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        UnprocessableEntityException,
      );

      try {
        await service.register(registerDto);
      } catch (err: unknown) {
        const error = err as UnprocessableEntityException;
        const response = error.getResponse() as { errors: Record<string, string[]> };
        expect(response.errors.username).toEqual(['has already been taken']);
      }
    });

    it('should report both email and username taken when both collide', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.findByUsername.mockResolvedValue(mockUser);

      const registerDto = {
        user: {
          email: 'jake@jake.jake',
          username: 'Jacob',
          password: 'plainpassword123',
        },
      };

      try {
        await service.register(registerDto);
        fail('Should have thrown UnprocessableEntityException');
      } catch (err: unknown) {
        const error = err as UnprocessableEntityException;
        const response = error.getResponse() as { errors: Record<string, string[]> };
        expect(response.errors.email).toEqual(['has already been taken']);
        expect(response.errors.username).toEqual(['has already been taken']);
      }
    });
  });

  describe('login', () => {
    it('should authenticate user and return token when credentials are valid', async () => {
      const plainPassword = 'correctpassword123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const userWithHash: User = { ...mockUser, password: hashedPassword };

      usersService.findByEmail.mockResolvedValue(userWithHash);
      jwtService.sign.mockReturnValue(sampleToken);

      const loginDto = {
        user: {
          email: userWithHash.email,
          password: plainPassword,
        },
      };

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.user.email);
      expect(result.user.email).toBe(userWithHash.email);
      expect(result.user.token).toBe(sampleToken);
    });

    it('should throw UnprocessableEntityException when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const loginDto = {
        user: {
          email: 'nonexistent@test.com',
          password: 'somepassword',
        },
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        UnprocessableEntityException,
      );

      try {
        await service.login(loginDto);
      } catch (err: unknown) {
        const error = err as UnprocessableEntityException;
        const response = error.getResponse() as { errors: Record<string, string[]> };
        expect(response.errors.credentials).toEqual(['invalid email or password']);
      }
    });

    it('should throw UnprocessableEntityException when password does not match', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const userWithHash: User = { ...mockUser, password: hashedPassword };

      usersService.findByEmail.mockResolvedValue(userWithHash);

      const loginDto = {
        user: {
          email: userWithHash.email,
          password: 'wrongpassword',
        },
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('logout', () => {
    it('should calculate remaining TTL and store token in Redis blacklist', async () => {
      const futureUnixTimestamp = Math.floor(Date.now() / 1000) + 1800; // 30 minutes in future
      jwtService.decode.mockReturnValue({ exp: futureUnixTimestamp });

      await service.logout(sampleToken);

      expect(jwtService.decode).toHaveBeenCalledWith(sampleToken);
      expect(redisTokenRepository.setBlacklistToken).toHaveBeenCalledWith(
        sampleToken,
        expect.any(Number),
      );
    });

    it('should ignore token if expired or decoded payload has no exp', async () => {
      jwtService.decode.mockReturnValue(null);
      await service.logout(sampleToken);
      expect(redisTokenRepository.setBlacklistToken).not.toHaveBeenCalled();

      const pastUnixTimestamp = Math.floor(Date.now() / 1000) - 100;
      jwtService.decode.mockReturnValue({ exp: pastUnixTimestamp });
      await service.logout(sampleToken);
      expect(redisTokenRepository.setBlacklistToken).not.toHaveBeenCalled();
    });
  });

  describe('buildUserResponse', () => {
    it('should use provided token when passed', () => {
      const explicitToken = 'custom.explicit.token';
      const result = service.buildUserResponse(mockUser, explicitToken);

      expect(result.user.token).toBe(explicitToken);
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should generate new token when none provided', () => {
      jwtService.sign.mockReturnValue(sampleToken);
      const result = service.buildUserResponse(mockUser);

      expect(result.user.token).toBe(sampleToken);
      expect(jwtService.sign).toHaveBeenCalled();
    });
  });
});
