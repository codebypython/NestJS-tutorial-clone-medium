import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);
    Logger.log(`Redis module initialized for ${host}:${port}`, 'RedisService');
  }

  async setBlacklistToken(_token: string, _ttlSeconds: number): Promise<void> {
    await Promise.resolve();
  }

  async isTokenBlacklisted(_token: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  onModuleDestroy(): void {
    Logger.log('Redis module disconnected', 'RedisService');
  }
}
