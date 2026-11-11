import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redisClient.quit();
      Logger.log('Redis client disconnected', 'RedisService');
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      Logger.warn(
        {
          message: 'Redis disconnection failure',
          errorName: errorObj.name,
          errorMessage: errorObj.message,
          stackTrace: errorObj.stack,
        },
        'RedisService',
      );
    }
  }
}
