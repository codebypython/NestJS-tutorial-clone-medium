import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from '../profiles/profiles.service';
import { User } from '../users/entities/user.entity';
import { ArticlesRepository } from './articles.repository';
import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';

describe('ArticlesService', () => {
  let service: ArticlesService;

  const authorUser: User = {
    id: 'user-author-1',
    email: 'author@test.com',
    username: 'author_user',
    password: 'hashed_password',
    bio: 'Author bio',
    image: 'https://example.com/author.jpg',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const otherUser: User = {
    id: 'user-other-2',
    email: 'other@test.com',
    username: 'other_user',
    password: 'hashed_password',
    bio: null,
    image: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const baseArticle: Article = {
    id: 'article-uuid-1',
    slug: 'how-to-train-your-dragon',
    title: 'How to train your dragon',
    description: 'Ever wonder how?',
    body: 'It takes a Jacobian',
    authorId: authorUser.id,
    author: authorUser,
    favoritesCount: 0,
    tags: [
      { id: 'tag-1', name: 'dragons', createdAt: new Date() },
      { id: 'tag-2', name: 'training', createdAt: new Date() },
    ],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockArticlesRepository = {
    findBySlug: jest.fn(),
    findSummaryBySlug: jest.fn(),
    findAll: jest.fn(),
    findFeed: jest.fn(),
    findFavoritedArticleIds: jest.fn(),
    createWithSlugAndTags: jest.fn(),
    updateWithSlugAndTags: jest.fn(),
    deleteById: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
  };

  const mockProfilesService = {
    findFollowingIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: ArticlesRepository, useValue: mockArticlesRepository },
        { provide: ProfilesService, useValue: mockProfilesService },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    jest.clearAllMocks();
    mockArticlesRepository.findFavoritedArticleIds.mockResolvedValue(new Set<string>());
    mockProfilesService.findFollowingIds.mockResolvedValue(new Set<string>());
  });

  describe('findArticleSummaryOrThrow', () => {
    it('should return article summary when article exists', async () => {
      mockArticlesRepository.findSummaryBySlug.mockResolvedValue({
        id: baseArticle.id,
        authorId: baseArticle.authorId,
      });

      const result = await service.findArticleSummaryOrThrow(baseArticle.slug);

      expect(mockArticlesRepository.findSummaryBySlug).toHaveBeenCalledWith(baseArticle.slug);
      expect(result).toEqual({ id: baseArticle.id, authorId: baseArticle.authorId });
    });

    it('should throw NotFoundException when article does not exist', async () => {
      mockArticlesRepository.findSummaryBySlug.mockResolvedValue(null);

      await expect(service.findArticleSummaryOrThrow('missing-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create an article and return mapped response', async () => {
      mockArticlesRepository.createWithSlugAndTags.mockResolvedValue(baseArticle);

      const result = await service.create(
        {
          article: {
            title: 'How to train your dragon',
            description: 'Ever wonder how?',
            body: 'It takes a Jacobian',
            tagList: ['training', 'dragons'],
          },
        },
        authorUser,
      );

      expect(mockArticlesRepository.createWithSlugAndTags).toHaveBeenCalledWith({
        title: 'How to train your dragon',
        description: 'Ever wonder how?',
        body: 'It takes a Jacobian',
        tagList: ['training', 'dragons'],
        author: authorUser,
      });
      expect(result.article.slug).toBe('how-to-train-your-dragon');
      expect(result.article.tagList).toEqual(['dragons', 'training']);
      expect(result.article.author.username).toBe('author_user');
    });
  });

  describe('findAll', () => {
    it('should return paginated articles and count with user interactions', async () => {
      mockArticlesRepository.findAll.mockResolvedValue([[baseArticle], 1]);
      mockArticlesRepository.findFavoritedArticleIds.mockResolvedValue(
        new Set([baseArticle.id]),
      );
      mockProfilesService.findFollowingIds.mockResolvedValue(
        new Set([authorUser.id]),
      );

      const result = await service.findAll({ tag: 'dragons', limit: 10, offset: 0 }, otherUser);

      expect(mockArticlesRepository.findAll).toHaveBeenCalledWith({
        tag: 'dragons',
        limit: 10,
        offset: 0,
      });
      expect(result.articlesCount).toBe(1);
      expect(result.articles[0].favorited).toBe(true);
      expect(result.articles[0].author.following).toBe(true);
    });

    it('should skip interaction lookup when list is empty', async () => {
      mockArticlesRepository.findAll.mockResolvedValue([[], 0]);

      const result = await service.findAll({}, otherUser);

      expect(mockArticlesRepository.findFavoritedArticleIds).not.toHaveBeenCalled();
      expect(mockProfilesService.findFollowingIds).not.toHaveBeenCalled();
      expect(result).toEqual({ articles: [], articlesCount: 0 });
    });
  });

  describe('findFeed', () => {
    it('should return followed users articles', async () => {
      mockArticlesRepository.findFeed.mockResolvedValue([[baseArticle], 1]);
      mockArticlesRepository.findFavoritedArticleIds.mockResolvedValue(new Set<string>());
      mockProfilesService.findFollowingIds.mockResolvedValue(new Set([authorUser.id]));

      const result = await service.findFeed({ limit: 5, offset: 0 }, otherUser);

      expect(mockArticlesRepository.findFeed).toHaveBeenCalledWith(otherUser.id, {
        limit: 5,
        offset: 0,
      });
      expect(result.articlesCount).toBe(1);
      expect(result.articles[0].author.following).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when article does not exist', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findOne('missing-slug', null)).rejects.toThrow(NotFoundException);
    });

    it('should return single article for anonymous user without querying interactions', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(baseArticle);

      const result = await service.findOne(baseArticle.slug, null);

      expect(mockArticlesRepository.findFavoritedArticleIds).not.toHaveBeenCalled();
      expect(mockProfilesService.findFollowingIds).not.toHaveBeenCalled();
      expect(result.article.favorited).toBe(false);
      expect(result.article.author.following).toBe(false);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException when non-author attempts update', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(baseArticle);

      await expect(
        service.update(baseArticle.slug, { article: { title: 'Hijacked' } }, otherUser),
      ).rejects.toThrow(ForbiddenException);
      expect(mockArticlesRepository.updateWithSlugAndTags).not.toHaveBeenCalled();
    });

    it('should update article when called by author', async () => {
      const updated = { ...baseArticle, title: 'Updated Dragon', slug: 'updated-dragon' };
      mockArticlesRepository.findBySlug.mockResolvedValue(baseArticle);
      mockArticlesRepository.updateWithSlugAndTags.mockResolvedValue(updated);

      const result = await service.update(
        baseArticle.slug,
        { article: { title: 'Updated Dragon' } },
        authorUser,
      );

      expect(mockArticlesRepository.updateWithSlugAndTags).toHaveBeenCalledWith(baseArticle, {
        title: 'Updated Dragon',
        description: undefined,
        body: undefined,
        tagList: undefined,
      });
      expect(result.article.slug).toBe('updated-dragon');
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException when non-author attempts delete', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(baseArticle);

      await expect(service.remove(baseArticle.slug, otherUser)).rejects.toThrow(ForbiddenException);
      expect(mockArticlesRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should delete article when called by author', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue(baseArticle);

      await service.remove(baseArticle.slug, authorUser);

      expect(mockArticlesRepository.deleteById).toHaveBeenCalledWith(baseArticle.id);
    });
  });

  describe('favorite & unfavorite', () => {
    it('should favorite an article and reflect interaction state', async () => {
      const favArticle = { ...baseArticle, favoritesCount: 1 };
      mockArticlesRepository.findBySlug.mockResolvedValue(baseArticle);
      mockArticlesRepository.addFavorite.mockResolvedValue(favArticle);
      mockArticlesRepository.findFavoritedArticleIds.mockResolvedValue(
        new Set([baseArticle.id]),
      );
      mockProfilesService.findFollowingIds.mockResolvedValue(new Set<string>());

      const result = await service.favorite(baseArticle.slug, otherUser);

      expect(mockArticlesRepository.addFavorite).toHaveBeenCalledWith(otherUser.id, baseArticle);
      expect(result.article.favorited).toBe(true);
      expect(result.article.favoritesCount).toBe(1);
    });

    it('should unfavorite an article and reflect updated count', async () => {
      mockArticlesRepository.findBySlug.mockResolvedValue({ ...baseArticle, favoritesCount: 1 });
      mockArticlesRepository.removeFavorite.mockResolvedValue(baseArticle);

      const result = await service.unfavorite(baseArticle.slug, otherUser);

      expect(mockArticlesRepository.removeFavorite).toHaveBeenCalledWith(
        otherUser.id,
        expect.objectContaining({ id: baseArticle.id }),
      );
      expect(result.article.favorited).toBe(false);
      expect(result.article.favoritesCount).toBe(0);
    });
  });
});
