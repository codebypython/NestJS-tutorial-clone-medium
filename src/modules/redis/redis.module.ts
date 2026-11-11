import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { DEFAULT_REDIS_PORT, REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';
import { RedisTokenRepository } from './repositories/redis-token.repository';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        const host = configService.get<string>('redis.host', 'localhost');
        const port = configService.get<number>('redis.port', DEFAULT_REDIS_PORT);
        return new Redis({
          host,
          port,
          lazyConnect: true,
          maxRetriesPerRequest: 3,
        });
      },
    },
    RedisTokenRepository,
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisTokenRepository, RedisService],
})
export class RedisModule {}
