import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ConduitValidationPipe } from '../src/common/pipes/validation.pipe';
import { Follow } from '../src/modules/profiles/entities/follow.entity';
import { User } from '../src/modules/users/entities/user.entity';

describe('Profiles & Social Follow Endpoints (e2e)', () => {
  let app: INestApplication;
  const timestamp = Date.now();
  const followerUser = {
    email: `follower_${timestamp}@test.com`,
    username: `follower_${timestamp}`,
    password: 'password123',
  };
  const targetUser = {
    email: `target_${timestamp}@test.com`,
    username: `target_${timestamp}`,
    password: 'password123',
  };

  let followerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ConduitValidationPipe());

    await app.init();

    // Register follower and target
    const regFollower = await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: followerUser });
    followerToken = regFollower.body?.user?.token;

    await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: targetUser });
  });

  afterAll(async () => {
    if (app) {
      try {
        const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
        const followRepo = app.get<Repository<Follow>>(
          getRepositoryToken(Follow),
        );

        await followRepo.delete({});
        await userRepo
          .createQueryBuilder()
          .delete()
          .where('email LIKE :pattern', { pattern: '%@test.com' })
          .execute();
      } catch {
        // Suppress teardown error
      }
      await app.close();
    }
  });

  describe('GET /api/profiles/:username', () => {
    it('should return target profile with following=false when unauthenticated', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/profiles/${targetUser.username}`)
        .expect(200);

      expect(res.body.profile).toHaveProperty('username', targetUser.username);
      expect(res.body.profile.following).toBe(false);
    });

    it('should return 404 when target user does not exist', async () => {
      await request(app.getHttpServer())
        .get('/api/profiles/nonexistent_user_99999')
        .expect(404);
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('should reject self-follow with 422', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/profiles/${followerUser.username}/follow`)
        .set('Authorization', `Token ${followerToken}`)
        .expect(422);

      expect(res.body.errors).toHaveProperty('user');
    });

    it('should follow target user and return following=true', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/profiles/${targetUser.username}/follow`)
        .set('Authorization', `Token ${followerToken}`)
        .expect(200);

      expect(res.body.profile.following).toBe(true);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('should unfollow target user and return following=false', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/profiles/${targetUser.username}/follow`)
        .set('Authorization', `Token ${followerToken}`)
        .expect(200);

      expect(res.body.profile.following).toBe(false);
    });
  });
});
