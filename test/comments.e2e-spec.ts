import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ConduitValidationPipe } from '../src/common/pipes/validation.pipe';
import { User } from '../src/modules/users/entities/user.entity';

describe('Comments Endpoints (e2e)', () => {
  let app: INestApplication;
  const timestamp = Date.now();

  const authorUser = {
    email: `comment_author_${timestamp}@test.com`,
    username: `comment_author_${timestamp}`,
    password: 'password123',
  };

  const commenterUser = {
    email: `comment_user_${timestamp}@test.com`,
    username: `comment_user_${timestamp}`,
    password: 'password123',
  };

  const strangerUser = {
    email: `comment_stranger_${timestamp}@test.com`,
    username: `comment_stranger_${timestamp}`,
    password: 'password123',
  };

  let authorToken: string;
  let commenterToken: string;
  let strangerToken: string;
  let articleSlug: string;
  let createdCommentId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ConduitValidationPipe());

    await app.init();

    const [regAuthor, regCommenter, regStranger] = await Promise.all([
      request(app.getHttpServer()).post('/api/users').send({ user: authorUser }),
      request(app.getHttpServer()).post('/api/users').send({ user: commenterUser }),
      request(app.getHttpServer()).post('/api/users').send({ user: strangerUser }),
    ]);

    authorToken = regAuthor.body?.user?.token;
    commenterToken = regCommenter.body?.user?.token;
    strangerToken = regStranger.body?.user?.token;

    const articleRes = await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: `Article for Comments ${timestamp}`,
          description: 'Description',
          body: 'Body content',
          tagList: ['testing'],
        },
      });

    articleSlug = articleRes.body.article.slug;
  });

  afterAll(async () => {
    if (app) {
      try {
        const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
        await userRepo
          .createQueryBuilder()
          .delete()
          .where('email IN (:...emails)', {
            emails: [authorUser.email, commenterUser.email, strangerUser.email],
          })
          .execute();
      } catch {
        // Suppress teardown errors
      }
      await app.close();
    }
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('should reject unauthorized request with 401', async () => {
      await request(app.getHttpServer())
        .post(`/api/articles/${articleSlug}/comments`)
        .send({ comment: { body: 'Unauthorized comment' } })
        .expect(401);
    });

    it('should reject empty or whitespace body with 422', async () => {
      await request(app.getHttpServer())
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${commenterToken}`)
        .send({ comment: { body: '     ' } })
        .expect(422);
    });

    it('should return 404 if article slug does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/nonexistent-article-slug/comments')
        .set('Authorization', `Token ${commenterToken}`)
        .send({ comment: { body: 'Valid body' } })
        .expect(404);
    });

    it('should create comment and return 201 with comment object', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${commenterToken}`)
        .send({ comment: { body: 'His name was my name too.' } })
        .expect(201);

      expect(res.body.comment).toHaveProperty('id');
      expect(res.body.comment.body).toBe('His name was my name too.');
      expect(res.body.comment.author.username).toBe(commenterUser.username);
      expect(res.body.comment.author.following).toBe(false);
      createdCommentId = res.body.comment.id;
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('should return 404 if article does not exist', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/nonexistent-article-slug/comments')
        .expect(404);
    });

    it('should return comments list without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/articles/${articleSlug}/comments`)
        .expect(200);

      expect(Array.isArray(res.body.comments)).toBe(true);
      expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
      expect(res.body.comments[0].body).toBe('His name was my name too.');
    });

    it('should return comments list with following status when authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/api/profiles/${commenterUser.username}/follow`)
        .set('Authorization', `Token ${authorToken}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${authorToken}`)
        .expect(200);

      const foundComment = res.body.comments.find(
        (c: { id: number }) => c.id === createdCommentId,
      );
      expect(foundComment).toBeDefined();
      expect(foundComment.author.following).toBe(true);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('should reject unauthorized request with 401', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${articleSlug}/comments/${createdCommentId}`)
        .expect(401);
    });

    it('should return 404 for nonexistent comment id', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${articleSlug}/comments/99999`)
        .set('Authorization', `Token ${commenterToken}`)
        .expect(404);
    });

    it('should return 403 when stranger user attempts to delete comment', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${articleSlug}/comments/${createdCommentId}`)
        .set('Authorization', `Token ${strangerToken}`)
        .expect(403);
    });

    it('should allow article author to delete comment with 204', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${articleSlug}/comments/${createdCommentId}`)
        .set('Authorization', `Token ${authorToken}`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .get(`/api/articles/${articleSlug}/comments`)
        .expect(200);

      const exists = res.body.comments.some(
        (c: { id: number }) => c.id === createdCommentId,
      );
      expect(exists).toBe(false);
    });

    it('should allow comment author to delete their own comment with 204', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/api/articles/${articleSlug}/comments`)
        .set('Authorization', `Token ${commenterToken}`)
        .send({ comment: { body: 'Another comment to be self-deleted' } })
        .expect(201);

      const newCommentId = createRes.body.comment.id;

      await request(app.getHttpServer())
        .delete(`/api/articles/${articleSlug}/comments/${newCommentId}`)
        .set('Authorization', `Token ${commenterToken}`)
        .expect(204);
    });
  });
});
