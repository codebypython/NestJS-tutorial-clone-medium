import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ConduitValidationPipe } from '../src/common/pipes/validation.pipe';
import { User } from '../src/modules/users/entities/user.entity';

describe('Articles Endpoints (e2e)', () => {
  let app: INestApplication;
  const timestamp = Date.now();
  const authorUser = {
    email: `article_author_${timestamp}@test.com`,
    username: `article_author_${timestamp}`,
    password: 'password123',
  };
  const readerUser = {
    email: `article_reader_${timestamp}@test.com`,
    username: `article_reader_${timestamp}`,
    password: 'password123',
  };

  let authorToken: string;
  let readerToken: string;
  let createdSlug: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ConduitValidationPipe());

    await app.init();

    const regAuthor = await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: authorUser });
    authorToken = regAuthor.body?.user?.token;

    const regReader = await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: readerUser });
    readerToken = regReader.body?.user?.token;
  });

  afterAll(async () => {
    if (app) {
      try {
        const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
        await userRepo
          .createQueryBuilder()
          .delete()
          .where('email IN (:...emails)', {
            emails: [authorUser.email, readerUser.email],
          })
          .execute();
      } catch {
        // Suppress teardown error
      }
      await app.close();
    }
  });

  describe('POST /api/articles', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/articles')
        .send({
          article: {
            title: 'Unauthorized article',
            description: 'Desc',
            body: 'Body',
          },
        })
        .expect(401);
    });

    it('should reject blank whitespace fields with 422', async () => {
      await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: '   ',
            description: 'Desc',
            body: 'Body',
          },
        })
        .expect(422);
    });

    it('should create an article and return 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: `How to train your dragon ${timestamp}`,
            description: 'Ever wonder how?',
            body: 'It takes a Jacobian',
            tagList: ['dragons', 'training'],
          },
        })
        .expect(201);

      expect(res.body.article).toHaveProperty('slug');
      expect(res.body.article.body).toBe('It takes a Jacobian');
      expect(res.body.article.tagList).toEqual(['dragons', 'training']);
      expect(res.body.article.favorited).toBe(false);
      expect(res.body.article.favoritesCount).toBe(0);
      createdSlug = res.body.article.slug;
    });
  });

  describe('GET /api/articles & GET /api/articles/:slug', () => {
    it('should list articles with body included', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/articles')
        .query({ tag: 'dragons', author: authorUser.username })
        .expect(200);

      expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);
      expect(res.body.articles[0]).toHaveProperty('body');
    });

    it('should get single article by slug', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/articles/${createdSlug}`)
        .expect(200);

      expect(res.body.article.slug).toBe(createdSlug);
    });

    it('should return 404 for unknown slug', async () => {
      await request(app.getHttpServer()).get('/api/articles/nonexistent-slug-99999').expect(404);
    });
  });

  describe('GET /api/articles/feed', () => {
    it('should return articles from followed authors', async () => {
      await request(app.getHttpServer())
        .post(`/api/profiles/${authorUser.username}/follow`)
        .set('Authorization', `Token ${readerToken}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/articles/feed')
        .set('Authorization', `Token ${readerToken}`)
        .expect(200);

      expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);
      expect(res.body.articles[0].author.following).toBe(true);
      expect(res.body.articles[0]).toHaveProperty('body');
    });
  });

  describe('POST & DELETE /api/articles/:slug/favorite', () => {
    it('should favorite and unfavorite idempotently', async () => {
      const favRes = await request(app.getHttpServer())
        .post(`/api/articles/${createdSlug}/favorite`)
        .set('Authorization', `Token ${readerToken}`)
        .expect(200);

      expect(favRes.body.article.favorited).toBe(true);
      expect(favRes.body.article.favoritesCount).toBe(1);

      const unfavRes = await request(app.getHttpServer())
        .delete(`/api/articles/${createdSlug}/favorite`)
        .set('Authorization', `Token ${readerToken}`)
        .expect(200);

      expect(unfavRes.body.article.favorited).toBe(false);
      expect(unfavRes.body.article.favoritesCount).toBe(0);
    });
  });

  describe('PUT & DELETE /api/articles/:slug', () => {
    it('should forbid non-author from updating', async () => {
      await request(app.getHttpServer())
        .put(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${readerToken}`)
        .send({ article: { title: 'Hijacked' } })
        .expect(403);
    });

    it('should allow author to update article', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${authorToken}`)
        .send({ article: { title: `Updated Dragon ${timestamp}` } })
        .expect(200);

      expect(res.body.article.title).toBe(`Updated Dragon ${timestamp}`);
      createdSlug = res.body.article.slug;
    });

    it('should forbid non-author from deleting', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${readerToken}`)
        .expect(403);
    });

    it('should allow author to delete article with 204', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${createdSlug}`)
        .set('Authorization', `Token ${authorToken}`)
        .expect(204);

      await request(app.getHttpServer()).get(`/api/articles/${createdSlug}`).expect(404);
    });
  });
});
