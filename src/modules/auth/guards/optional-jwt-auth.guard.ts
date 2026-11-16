import {
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RedisTokenRepository } from '../../redis/repositories/redis-token.repository';
import { AuthenticatedRequest } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly redisTokenRepository: RedisTokenRepository) {
    super();
  }

  override handleRequest<TUser = unknown>(
    err: unknown,
    user: unknown,
  ): TUser {
    if (err || !user) {
      return null as TUser;
    }
    return user as TUser;
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return true;
    }

    try {
      await super.canActivate(context);
    } catch (authError) {
      Logger.debug(
        {
          message: 'Optional auth encountered token verification failure; treating as guest',
          explanation: 'Token validation failed in optional authentication route',
          error: String(authError),
        },
        'OptionalJwtAuthGuard',
      );
      request.user = undefined;
      return true;
    }

    const token = this.extractTokenFromHeader(request);
    if (token) {
      const isBlacklisted =
        await this.redisTokenRepository.isTokenBlacklisted(token);
      if (isBlacklisted) {
        request.user = undefined;
      } else {
        request.token = token;
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }
    const tokenMatch = authHeader.match(/^(?:Token|Bearer)\s+(\S+)$/i);
    return tokenMatch ? tokenMatch[1] : null;
  }
}
