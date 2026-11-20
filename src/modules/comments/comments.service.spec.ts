import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesRepository } from '../articles/articles.repository';
import { Article } from '../articles/entities/article.entity';
import { User } from '../users/entities/user.entity';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

describe('CommentsService', () => {
  let service: CommentsService;

  const commentAuthor: User = {
    id: 'user-commenter-1',
    email: 'commenter@test.com',
    username: 'commenter',
    password: 'hashed_password',
    bio: null,
    image: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const articleAuthor: User = {
    id: 'user-article-owner-2',
    email: 'owner@test.com',
    username: 'article_owner',
    password: 'hashed_password',
    bio: null,
    image: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const thirdUser: User = {
    id: 'user-third-3',
    email: 'third@test.com',
    username: 'third_user',
    password: 'hashed_password',
    bio: null,
    image: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockArticle: Article = {
    id: 'article-uuid-1',
    slug: 'how-to-train-your-dragon',
    title: 'How to train your dragon',
    description: 'Ever wonder how?',
    body: 'It takes a Jacobian',
    authorId: articleAuthor.id,
    author: articleAuthor,
    favoritesCount: 0,
    tags: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockComment: Comment = {
    id: 1,
    body: 'His name was my name too.',
    authorId: commentAuthor.id,
    author: commentAuthor,
    articleId: mockArticle.id,
    article: mockArticle,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockCommentsRepository = {
    findById: jest.fn(),
    findByArticleId: jest.fn(),
    findFollowingAuthorIds: jest.fn(),
    create: jest.fn(),
    deleteById: jest.fn(),
  };

  const mockArticlesRepository = {
    findBySlug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: CommentsRepository, useValue: mockCommentsRepository },
        { provide: ArticlesRepository, useValue: mockArticlesRepository },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    jest.clearAllMocks();
  });

  describe('addComment', () => {
    it('should throw NotFoundException if article does not exist', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.addComment('missing-slug', { comment: { body: 'Test' } }, commentAuthor),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create comment and return single comment response', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentsRepository.create.mockResolvedValue(mockComment);

      const result = await service.addComment(
        mockArticle.slug,
        { comment: { body: 'His name was my name too.' } },
        commentAuthor,
      );

      expect(mockCommentsRepository.create).toHaveBeenCalledWith({
        body: 'His name was my name too.',
        articleId: mockArticle.id,
        author: commentAuthor,
      });
      expect(result.comment.id).toBe(1);
      expect(result.comment.author.username).toBe('commenter');
      expect(result.comment.author.following).toBe(false);
    });
  });

  describe('getComments', () => {
    it('should throw NotFoundException if article does not exist', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getComments('missing-slug', null)).rejects.toThrow(NotFoundException);
    });

    it('should return empty list when no comments exist', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentsRepository.findByArticleId.mockResolvedValue([]);

      const result = await service.getComments(mockArticle.slug, null);

      expect(result).toEqual({ comments: [] });
    });

    it('should return comments with following status for authenticated user', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentsRepository.findByArticleId.mockResolvedValue([mockComment]);
      mockCommentsRepository.findFollowingAuthorIds.mockResolvedValue(
        new Set([commentAuthor.id]),
      );

      const result = await service.getComments(mockArticle.slug, articleAuthor);

      expect(mockCommentsRepository.findFollowingAuthorIds).toHaveBeenCalledWith(articleAuthor.id, [
        commentAuthor.id,
      ]);
      expect(result.comments[0].author.following).toBe(true);
    });
  });

  describe('deleteComment', () => {
    it('should throw NotFoundException if article does not exist', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(null);

      await expect(service.deleteComment('missing-slug', 1, commentAuthor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentsRepository.findById.mockResolvedValue(null);

      await expect(service.deleteComment(mockArticle.slug, 999, commentAuthor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if comment belongs to another article', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentsRepository.findById.mockResolvedValue({
        ...mockComment,
        articleId: 'different-article-id',
      });

      await expect(service.deleteComment(mockArticle.slug, 1, commentAuthor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is neither comment author nor article owner', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentsRepository.findById.mockResolvedValue(mockComment);

      await expect(service.deleteComment(mockArticle.slug, 1, thirdUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow comment author to delete comment', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentsRepository.findById.mockResolvedValue(mockComment);

      await service.deleteComment(mockArticle.slug, 1, commentAuthor);

      expect(mockCommentsRepository.deleteById).toHaveBeenCalledWith(1);
    });

    it('should allow article owner to delete any comment on their article', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(mockArticle);
      mockCommentsRepository.findById.mockResolvedValue(mockComment);

      await service.deleteComment(mockArticle.slug, 1, articleAuthor);

      expect(mockCommentsRepository.deleteById).toHaveBeenCalledWith(1);
    });
  });
});
