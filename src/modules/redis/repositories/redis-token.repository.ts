import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  BLACKLISTED_STATUS_VALUE,
  CONDUIT_BLACKLIST_PREFIX,
  REDIS_CLIENT,
} from '../redis.constants';

@Injectable()
export class RedisTokenRepository {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  private buildKey(token: string): string {
    return `${CONDUIT_BLACKLIST_PREFIX}${token}`;
  }

  async setBlacklistToken(token: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }
    const key = this.buildKey(token);
    await this.redisClient.set(key, BLACKLISTED_STATUS_VALUE, 'EX', ttlSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = this.buildKey(token);
    const existsResult = await this.redisClient.exists(key);
    return existsResult === 1;
  }
}
