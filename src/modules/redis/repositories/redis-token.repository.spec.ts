import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import {
  BLACKLISTED_STATUS_VALUE,
  CONDUIT_BLACKLIST_PREFIX,
  REDIS_CLIENT,
} from '../redis.constants';
import { RedisTokenRepository } from './redis-token.repository';

describe('RedisTokenRepository', () => {
  let repository: RedisTokenRepository;
  let redisClient: jest.Mocked<Partial<Redis>>;

  beforeEach(async () => {
    redisClient = {
      set: jest.fn().mockResolvedValue('OK'),
      exists: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisTokenRepository,
        {
          provide: REDIS_CLIENT,
          useValue: redisClient,
        },
      ],
    }).compile();

    repository = module.get<RedisTokenRepository>(RedisTokenRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('setBlacklistToken', () => {
    it('should store token in blacklist with specified TTL when positive', async () => {
      const token = 'sample-jwt-token-string';
      const ttlSeconds = 3600;
      const expectedKey = `${CONDUIT_BLACKLIST_PREFIX}${token}`;

      await repository.setBlacklistToken(token, ttlSeconds);

      expect(redisClient.set).toHaveBeenCalledWith(
        expectedKey,
        BLACKLISTED_STATUS_VALUE,
        'EX',
        ttlSeconds,
      );
    });

    it('should not store token when TTL is zero or negative', async () => {
      const token = 'sample-jwt-token-string';

      await repository.setBlacklistToken(token, 0);
      await repository.setBlacklistToken(token, -10);

      expect(redisClient.set).not.toHaveBeenCalled();
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true when token key exists in Redis', async () => {
      const token = 'blacklisted-token-string';
      const expectedKey = `${CONDUIT_BLACKLIST_PREFIX}${token}`;
      (redisClient.exists as jest.Mock).mockResolvedValue(1);

      const result = await repository.isTokenBlacklisted(token);

      expect(redisClient.exists).toHaveBeenCalledWith(expectedKey);
      expect(result).toBe(true);
    });

    it('should return false when token key does not exist in Redis', async () => {
      const token = 'active-token-string';
      const expectedKey = `${CONDUIT_BLACKLIST_PREFIX}${token}`;
      (redisClient.exists as jest.Mock).mockResolvedValue(0);

      const result = await repository.isTokenBlacklisted(token);

      expect(redisClient.exists).toHaveBeenCalledWith(expectedKey);
      expect(result).toBe(false);
    });
  });
});
