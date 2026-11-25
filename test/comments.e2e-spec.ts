import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { Article } from '../src/modules/articles/entities/article.entity';
import { COMMENT_BODY_MAX_LENGTH } from '../src/modules/comments/dto/create-comment.dto';
import { Comment } from '../src/modules/comments/entities/comment.entity';
import {
  buildFakeCreateCommentPayload,
  seedFakeArticle,
  seedFakeComment,
  seedFakeFollow,
  seedFakeUser,
  SeededUser,
} from './factories/e2e-data.factory';
import { closeE2eApp, createE2eApp } from './helpers/e2e-app.helper';
import { truncateDatabase } from './helpers/e2e-database.helper';

interface CommentResponseItem {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

describe('CommentsController C2 Branch Coverage (e2e)', () => {
  let app: INestApplication;
  let commentRepository: Repository<Comment>;

  let articleAuthor: SeededUser;
  let commenter: SeededUser;
  let stranger: SeededUser;
  let article: Article;

  beforeAll(async () => {
    app = await createE2eApp();
    commentRepository = app.get<Repository<Comment>>(getRepositoryToken(Comment));
    await truncateDatabase(app);
  });

  beforeEach(async () => {
    articleAuthor = await seedFakeUser(app);
    commenter = await seedFakeUser(app);
    stranger = await seedFakeUser(app);
    article = await seedFakeArticle(app, articleAuthor.user, {
      tagNames: [faker.word.noun(), faker.word.adjective()],
    });
  });

  afterEach(async () => {
    await truncateDatabase(app);
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('should create a comment with Token auth, trim body, and persist in database (201)', async () => {
      const rawBody = faker.lorem.sentence({ min: 5, max: 10 });

      const res = await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({ comment: { body: `   ${rawBody}   ` } })
        .expect(201);

      const created: CommentResponseItem = res.body.comment;
      expect(typeof created.id).toBe('number');
      expect(created.body).toBe(rawBody);
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();
      expect(created.author).toEqual({
        username: commenter.user.username,
        bio: commenter.user.bio,
        image: commenter.user.image,
        following: false,
      });

      const persisted = await commentRepository.findOneBy({ id: created.id });
      expect(persisted).not.toBeNull();
      expect(persisted?.body).toBe(rawBody);
      expect(persisted?.articleId).toBe(article.id);
      expect(persisted?.authorId).toBe(commenter.user.id);
    });

    it('should create a comment with Bearer authorization scheme (201)', async () => {
      const payload = buildFakeCreateCommentPayload();

      const res = await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Bearer ${commenter.token}`)
        .send(payload)
        .expect(201);

      expect(res.body.comment.body).toBe(payload.comment.body);
    });

    it('should reject unauthenticated request without Authorization header (401)', async () => {
      const payload = buildFakeCreateCommentPayload();

      await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .send(payload)
        .expect(401);
    });

    it('should reject malformed Authorization scheme or invalid JWT signature (401)', async () => {
      const payload = buildFakeCreateCommentPayload();

      await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', 'Basic invalid-scheme-token')
        .send(payload)
        .expect(401);

      await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', 'Token invalid.jwt.signature')
        .send(payload)
        .expect(401);
    });

    it('should reject a JWT token revoked via logout in Redis blacklist (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/logout')
        .set('Authorization', `Token ${commenter.token}`)
        .expect(200);

      const payload = buildFakeCreateCommentPayload();

      await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send(payload)
        .expect(401);
    });

    it('should reject empty payload and empty comment object with 422', async () => {
      await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({})
        .expect(422);

      await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({ comment: {} })
        .expect(422);
    });

    it('should reject non-string or blank whitespace comment body with 422', async () => {
      await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({ comment: { body: 12345 } })
        .expect(422);

      await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({ comment: { body: '   \t\n  ' } })
        .expect(422);
    });

    it('should reject comment body exceeding max length with dynamic constraint message (422)', async () => {
      const oversizedBody = 'a'.repeat(COMMENT_BODY_MAX_LENGTH + 1);

      const res = await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({ comment: { body: oversizedBody } })
        .expect(422);

      expect(res.body.errors.body).toContain(
        `body must not exceed ${COMMENT_BODY_MAX_LENGTH} characters`,
      );
    });

    it('should reject non-whitelisted properties in request body (422)', async () => {
      await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({
          comment: {
            body: faker.lorem.sentence(),
            unexpectedField: 'not-allowed',
          },
        })
        .expect(422);
    });

    it('should return 404 when target article slug does not exist', async () => {
      const payload = buildFakeCreateCommentPayload();

      const res = await request(app.getHttpServer())
        .post('/api/articles/nonexistent-article-slug-c2/comments')
        .set('Authorization', `Token ${commenter.token}`)
        .send(payload)
        .expect(404);

      expect(res.body.errors.article).toEqual(['article not found']);
    });
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('should return empty comments array with no-store header when article has no comments (200)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/articles/${article.slug}/comments`)
        .expect(200);

      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body).toEqual({ comments: [] });
    });

    it('should return comments ordered newest-first with following=false when unauthenticated (200)', async () => {
      const olderTime = new Date(Date.now() - 60_000);
      const newerTime = new Date(Date.now() - 10_000);

      const olderComment = await seedFakeComment(app, commenter.user, article, {
        createdAt: olderTime,
      });
      const newerComment = await seedFakeComment(app, articleAuthor.user, article, {
        createdAt: newerTime,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/articles/${article.slug}/comments`)
        .expect(200);

      const items: CommentResponseItem[] = res.body.comments;
      expect(items).toHaveLength(2);
      expect(items[0].id).toBe(newerComment.id);
      expect(items[1].id).toBe(olderComment.id);
      expect(items[0].author.following).toBe(false);
      expect(items[1].author.following).toBe(false);
    });

    it('should compute author.following accurately for followed and unfollowed authors when authenticated (200)', async () => {
      await seedFakeFollow(app, stranger.user, commenter.user);

      const followedCommentOne = await seedFakeComment(app, commenter.user, article);
      const followedCommentTwo = await seedFakeComment(app, commenter.user, article);
      const unfollowedComment = await seedFakeComment(app, articleAuthor.user, article);

      const res = await request(app.getHttpServer())
        .get(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Token ${stranger.token}`)
        .expect(200);

      const items: CommentResponseItem[] = res.body.comments;
      expect(items).toHaveLength(3);

      const byId = new Map(items.map((item) => [item.id, item]));
      expect(byId.get(followedCommentOne.id)?.author.following).toBe(true);
      expect(byId.get(followedCommentTwo.id)?.author.following).toBe(true);
      expect(byId.get(unfollowedComment.id)?.author.following).toBe(false);
    });

    it('should gracefully treat invalid or blacklisted optional JWT as guest with following=false (200)', async () => {
      await seedFakeFollow(app, stranger.user, commenter.user);
      const seededComment = await seedFakeComment(app, commenter.user, article);

      const invalidTokenRes = await request(app.getHttpServer())
        .get(`/api/articles/${article.slug}/comments`)
        .set('Authorization', 'Token invalid.optional.jwt')
        .expect(200);

      expect(invalidTokenRes.body.comments[0].id).toBe(seededComment.id);
      expect(invalidTokenRes.body.comments[0].author.following).toBe(false);

      await request(app.getHttpServer())
        .post('/api/users/logout')
        .set('Authorization', `Token ${stranger.token}`)
        .expect(200);

      const blacklistedRes = await request(app.getHttpServer())
        .get(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Token ${stranger.token}`)
        .expect(200);

      expect(blacklistedRes.body.comments[0].id).toBe(seededComment.id);
      expect(blacklistedRes.body.comments[0].author.following).toBe(false);
    });

    it('should return 404 when article slug does not exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/articles/nonexistent-article-slug-list/comments')
        .expect(404);

      expect(res.body.errors.article).toEqual(['article not found']);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('should reject unauthenticated delete request with 401', async () => {
      const seededComment = await seedFakeComment(app, commenter.user, article);

      await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}/comments/${seededComment.id}`)
        .expect(401);

      expect(await commentRepository.findOneBy({ id: seededComment.id })).not.toBeNull();
    });

    it('should reject delete request using a blacklisted JWT token with 401', async () => {
      const seededComment = await seedFakeComment(app, commenter.user, article);

      await request(app.getHttpServer())
        .post('/api/users/logout')
        .set('Authorization', `Token ${commenter.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}/comments/${seededComment.id}`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(401);

      expect(await commentRepository.findOneBy({ id: seededComment.id })).not.toBeNull();
    });

    it('should reject non-numeric comment id with 400 via ParseIntPipe', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}/comments/not-a-number`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(400);
    });

    it('should return 404 when article slug does not exist', async () => {
      const seededComment = await seedFakeComment(app, commenter.user, article);

      const res = await request(app.getHttpServer())
        .delete(`/api/articles/nonexistent-article-slug-del/comments/${seededComment.id}`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(404);

      expect(res.body.errors.article).toEqual(['article not found']);
    });

    it('should return 404 when comment id does not exist', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}/comments/999999`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(404);

      expect(res.body.errors.comment).toEqual(['comment not found']);
    });

    it('should return 404 when comment belongs to a different article', async () => {
      const otherArticle = await seedFakeArticle(app, articleAuthor.user);
      const otherArticleComment = await seedFakeComment(app, commenter.user, otherArticle);

      const res = await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}/comments/${otherArticleComment.id}`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(404);

      expect(res.body.errors.comment).toEqual(['comment not found']);
      expect(await commentRepository.findOneBy({ id: otherArticleComment.id })).not.toBeNull();
    });

    it('should return 403 when stranger is neither comment author nor article author', async () => {
      const seededComment = await seedFakeComment(app, commenter.user, article);

      const res = await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}/comments/${seededComment.id}`)
        .set('Authorization', `Token ${stranger.token}`)
        .expect(403);

      expect(res.body.errors.comment).toEqual(['you are not authorized to delete this comment']);
      expect(await commentRepository.findOneBy({ id: seededComment.id })).not.toBeNull();
    });

    it('should allow comment author to delete their own comment on another user article (204)', async () => {
      const seededComment = await seedFakeComment(app, commenter.user, article);

      await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}/comments/${seededComment.id}`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(204);

      expect(await commentRepository.findOneBy({ id: seededComment.id })).toBeNull();
    });

    it('should allow article author to delete another user comment via dual-ownership (204)', async () => {
      const seededComment = await seedFakeComment(app, commenter.user, article);

      await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}/comments/${seededComment.id}`)
        .set('Authorization', `Token ${articleAuthor.token}`)
        .expect(204);

      expect(await commentRepository.findOneBy({ id: seededComment.id })).toBeNull();
    });

    it('should allow article author to delete their own comment on their own article (204)', async () => {
      const selfComment = await seedFakeComment(app, articleAuthor.user, article);

      await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}/comments/${selfComment.id}`)
        .set('Authorization', `Token ${articleAuthor.token}`)
        .expect(204);

      expect(await commentRepository.findOneBy({ id: selfComment.id })).toBeNull();
    });

    it('should cascade delete all comments when parent article is deleted (204)', async () => {
      await seedFakeComment(app, commenter.user, article);
      await seedFakeComment(app, stranger.user, article);

      expect(await commentRepository.count({ where: { articleId: article.id } })).toBe(2);

      await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}`)
        .set('Authorization', `Token ${articleAuthor.token}`)
        .expect(204);

      expect(await commentRepository.count({ where: { articleId: article.id } })).toBe(0);
    });
  });
});
