import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisTokenRepository } from '../../redis/repositories/redis-token.repository';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;
  let redisTokenRepository: RedisTokenRepository;

  const mockRedisTokenRepository = {
    isTokenBlacklisted: jest.fn(),
  };

  const createMockContext = (headers: Record<string, string> = {}): ExecutionContext => {
    const request: any = {
      headers,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionalJwtAuthGuard,
        {
          provide: RedisTokenRepository,
          useValue: mockRedisTokenRepository,
        },
      ],
    }).compile();

    guard = module.get<OptionalJwtAuthGuard>(OptionalJwtAuthGuard);
    redisTokenRepository = module.get<RedisTokenRepository>(
      RedisTokenRepository,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
    expect(redisTokenRepository).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should return null when error occurs or user is absent', () => {
      expect(guard.handleRequest(new Error('Auth failed'), null)).toBeNull();
      expect(guard.handleRequest(null, null)).toBeNull();
    });

    it('should return user when user is present and no error', () => {
      const mockUser = { id: 'user-1' };
      expect(guard.handleRequest(null, mockUser)).toEqual(mockUser);
    });
  });

  describe('canActivate', () => {
    it('should allow request through when no authorization header is provided', async () => {
      const context = createMockContext({});

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      const req = context.switchToHttp().getRequest();
      expect(req.user).toBeUndefined();
      expect(req.token).toBeUndefined();
    });

    it('should set token and allow request when valid authorization header is present and not blacklisted', async () => {
      const context = createMockContext({
        authorization: 'Token valid-jwt-token-123',
      });
      const req = context.switchToHttp().getRequest();
      req.user = { id: 'user-1' };

      jest
        .spyOn(
          Object.getPrototypeOf(Object.getPrototypeOf(guard)),
          'canActivate',
        )
        .mockResolvedValue(true);
      mockRedisTokenRepository.isTokenBlacklisted.mockResolvedValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(req.token).toBe('valid-jwt-token-123');
    });

    it('should clear user when token is blacklisted in Redis', async () => {
      const context = createMockContext({
        authorization: 'Bearer revoked-token-xyz',
      });
      const req = context.switchToHttp().getRequest();
      req.user = { id: 'user-1' };

      // Spy on super.canActivate to simulate passport success
      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockResolvedValue(true);
      mockRedisTokenRepository.isTokenBlacklisted.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(req.user).toBeUndefined();
      expect(req.token).toBeUndefined();
    });

    it('should suppress passport exceptions and allow unauthenticated request through', async () => {
      const context = createMockContext({
        authorization: 'Bearer bad.token.signature',
      });
      const req = context.switchToHttp().getRequest();

      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockRejectedValue(new Error('Invalid token'));

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(req.user).toBeUndefined();
    });
  });
});
