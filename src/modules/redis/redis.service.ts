import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);

    try {
      this.client = new Redis({
        host,
        port,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });

      this.client
        .connect()
        .then(() => {
          this.isConnected = true;
          this.logger.log(`Redis connected to ${host}:${port}`);
        })
        .catch((err: Error) => {
          this.isConnected = false;
          this.logger.warn(
            `Redis connection failed (${err.message}). Blacklist will operate in mock mode.`,
          );
        });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis initialization skipped: ${msg}`);
    }
  }

  async setBlacklistToken(token: string, ttlSeconds: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }
    await this.client.set(`token_blacklist:${token}`, 'revoked', 'EX', ttlSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }
    const result = await this.client.get(`token_blacklist:${token}`);
    return result !== null;
  }

  onModuleDestroy(): void {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
