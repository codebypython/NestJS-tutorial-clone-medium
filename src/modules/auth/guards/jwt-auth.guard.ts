import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RedisTokenRepository } from '../../redis/repositories/redis-token.repository';

export const TOKEN_AUTH_SCHEME = 'Token';
export const BEARER_AUTH_SCHEME = 'Bearer';

export interface AuthenticatedRequest extends Request {
  token?: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly redisTokenRepository: RedisTokenRepository) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPassportValid = (await super.canActivate(context)) as boolean;
    if (!isPassportValid) {
      return false;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Invalid authorization token format');
    }

    const isBlacklisted =
      await this.redisTokenRepository.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }
    request.token = token;

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


