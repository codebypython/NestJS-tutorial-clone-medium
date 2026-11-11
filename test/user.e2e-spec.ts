import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ConduitValidationPipe } from '../src/common/pipes/validation.pipe';
import { Attachment } from '../src/modules/attachments/entities/attachment.entity';
import { User } from '../src/modules/users/entities/user.entity';

describe('User & Attachments Endpoints (e2e)', () => {
  let app: INestApplication;
  const timestamp = Date.now();
  const testUser = {
    email: `user_${timestamp}@test.com`,
    username: `user_${timestamp}`,
    password: 'password123',
  };

  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ConduitValidationPipe());

    await app.init();

    // Register user
    const regRes = await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: testUser });
    authToken = regRes.body?.user?.token;
  });

  afterAll(async () => {
    if (app) {
      try {
        const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
        const attachmentRepo = app.get<Repository<Attachment>>(
          getRepositoryToken(Attachment),
        );

        await attachmentRepo.delete({});
        await userRepo
          .createQueryBuilder()
          .delete()
          .where('email LIKE :pattern', { pattern: '%@test.com' })
          .execute();
      } catch {
        // Suppress teardown error
      }

      const testUploadDir = path.join(process.cwd(), 'storage', 'test-uploads');
      if (fs.existsSync(testUploadDir)) {
        fs.rmSync(testUploadDir, { recursive: true, force: true });
      }

      await app.close();
    }
  });

  describe('GET /api/user', () => {
    it('should return current user with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user')
        .set('Authorization', `Token ${authToken}`)
        .expect(200);

      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).toHaveProperty('username', testUser.username);
    });

    it('should reject request without token with 401', async () => {
      await request(app.getHttpServer()).get('/api/user').expect(401);
    });
  });

  describe('PUT /api/user', () => {
    it('should update user bio and image', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/user')
        .set('Authorization', `Token ${authToken}`)
        .send({
          user: {
            bio: 'Updated bio text',
            image: 'https://example.com/photo.png',
          },
        })
        .expect(200);

      expect(res.body.user.bio).toBe('Updated bio text');
      expect(res.body.user.image).toBe('https://example.com/photo.png');
    });
  });

  describe('POST /api/attachments/avatar', () => {
    it('should reject non-image file upload with 422', async () => {
      await request(app.getHttpServer())
        .post('/api/attachments/avatar')
        .set('Authorization', `Token ${authToken}`)
        .attach('file', Buffer.from('%PDF-1.4...'), 'document.pdf')
        .expect(422);
    });

    it('should upload valid image avatar and return attachment url', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/attachments/avatar')
        .set('Authorization', `Token ${authToken}`)
        .attach('file', Buffer.from('fake-png-bytes'), 'avatar.png')
        .expect(201);

      expect(res.body).toHaveProperty('attachment');
      expect(res.body.attachment).toHaveProperty('id');
      expect(res.body.attachment).toHaveProperty('url');
      expect(res.body.attachment.url).toContain('/public/uploads/avatars/');
    });
  });
});
