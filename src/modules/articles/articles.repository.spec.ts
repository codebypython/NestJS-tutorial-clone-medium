import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/entities/user.entity';
import { ArticlesRepository } from './articles.repository';
import { ArticleFavorite } from './entities/article-favorite.entity';
import { Article } from './entities/article.entity';

describe('ArticlesRepository', () => {
  let repository: ArticlesRepository;

  const authorUser: User = {
    id: 'user-author-1',
    email: 'author@test.com',
    username: 'author_user',
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
    tags: [{ id: 'tag-1', name: 'dragons', createdAt: new Date() }],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockArticleRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockFavRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  };

  const mockTagRepo = {};

  const mockManager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === Article) {
        return mockArticleRepo;
      }
      if (entity === ArticleFavorite) {
        return mockFavRepo;
      }
      if (entity === Tag) {
        return mockTagRepo;
      }
      return {};
    }),
  };

  const mockDataSource = {
    transaction: jest.fn(async <T>(cb: (manager: typeof mockManager) => Promise<T>) =>
      cb(mockManager),
    ),
  };

  const mockTagsService = {
    resolveTags: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesRepository,
        { provide: getRepositoryToken(Article), useValue: mockArticleRepo },
        { provide: getRepositoryToken(ArticleFavorite), useValue: mockFavRepo },
        { provide: TagsService, useValue: mockTagsService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    repository = module.get<ArticlesRepository>(ArticlesRepository);
    jest.clearAllMocks();
  });

  it('should generate a unique suffixed slug on collision during create', async () => {
    mockArticleRepo.findOne
      .mockResolvedValueOnce({ id: 'other-id', slug: 'how-to-train-your-dragon' })
      .mockResolvedValueOnce(null);
    mockTagsService.resolveTags.mockResolvedValue(baseArticle.tags);
    mockArticleRepo.create.mockImplementation((data: Partial<Article>) => ({
      ...baseArticle,
      ...data,
    }));
    mockArticleRepo.save.mockImplementation(async (entity: Article) => entity);

    const created = await repository.createWithSlugAndTags({
      title: 'How to train your dragon',
      description: 'Ever wonder how?',
      body: 'It takes a Jacobian',
      tagList: ['dragons'],
      author: authorUser,
    });

    expect(created.slug).toMatch(/^how-to-train-your-dragon-[A-Za-z0-9_-]{6}$/);
  });

  it('should throw InternalServerErrorException when save fails with non-duplicate error', async () => {
    mockArticleRepo.findOne.mockResolvedValueOnce(null);
    mockTagsService.resolveTags.mockResolvedValue([]);
    mockArticleRepo.create.mockReturnValue(baseArticle);
    mockArticleRepo.save.mockRejectedValue(new Error('Connection lost'));

    await expect(
      repository.createWithSlugAndTags({
        title: 'How to train your dragon',
        description: 'Ever wonder how?',
        body: 'It takes a Jacobian',
        author: authorUser,
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should apply filters and deterministic ordering in findAll', async () => {
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[baseArticle], 1]);

    const result = await repository.findAll({
      tag: 'dragons',
      author: 'author_user',
      favorited: 'reader_user',
      limit: 10,
      offset: 5,
    });

    expect(mockQueryBuilder.innerJoin).toHaveBeenCalledTimes(3);
    expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('article.createdAt', 'DESC');
    expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('article.id', 'DESC');
    expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
    expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    expect(result).toEqual([[baseArticle], 1]);
  });

  it('should handle idempotent favorite and unfavorite transactions', async () => {
    mockFavRepo.findOneBy.mockResolvedValueOnce(null);
    mockFavRepo.insert.mockResolvedValue({});
    mockArticleRepo.increment.mockResolvedValue({});
    mockArticleRepo.findOne.mockResolvedValueOnce({ ...baseArticle, favoritesCount: 1 });

    const favorited = await repository.addFavorite('reader-1', baseArticle);
    expect(favorited.favoritesCount).toBe(1);

    const articleWithFavorites: Article = { ...baseArticle, favoritesCount: 5 };
    mockFavRepo.delete.mockResolvedValueOnce({ affected: 1 });
    mockQueryBuilder.execute.mockResolvedValueOnce({});
    mockArticleRepo.findOne.mockResolvedValueOnce({ ...baseArticle, favoritesCount: 4 });

    const unfavorited = await repository.removeFavorite('reader-1', articleWithFavorites);

    expect(mockQueryBuilder.update).toHaveBeenCalledWith(Article);
    expect(mockQueryBuilder.set).toHaveBeenCalledWith({
      favoritesCount: expect.any(Function),
    });
    const setFn = (
      mockQueryBuilder.set.mock.calls[0][0] as { favoritesCount: () => string }
    ).favoritesCount;
    expect(setFn()).toBe('GREATEST(favorites_count - 1, 0)');
    expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', {
      id: articleWithFavorites.id,
    });
    expect(mockQueryBuilder.execute).toHaveBeenCalled();
    expect(unfavorited.favoritesCount).toBe(4);
  });

  it('should find article summary by slug selecting only id and authorId', async () => {
    mockArticleRepo.findOne.mockResolvedValueOnce({
      id: baseArticle.id,
      authorId: baseArticle.authorId,
    });

    const result = await repository.findSummaryBySlug(baseArticle.slug);

    expect(mockArticleRepo.findOne).toHaveBeenCalledWith({
      where: { slug: baseArticle.slug },
      select: ['id', 'authorId'],
    });
    expect(result).toEqual({ id: baseArticle.id, authorId: baseArticle.authorId });
  });

  it('should return favorited article IDs for a given user', async () => {
    mockFavRepo.find.mockResolvedValueOnce([{ articleId: baseArticle.id }]);

    const result = await repository.findFavoritedArticleIds('reader-1', [baseArticle.id]);

    expect(mockFavRepo.find).toHaveBeenCalledWith({
      where: { userId: 'reader-1', articleId: expect.anything() },
      select: ['articleId'],
    });
    expect(result).toEqual(new Set([baseArticle.id]));
  });

  it('should return empty Set when articleIds is empty in findFavoritedArticleIds', async () => {
    const result = await repository.findFavoritedArticleIds('reader-1', []);
    expect(result).toEqual(new Set());
    expect(mockFavRepo.find).not.toHaveBeenCalled();
  });
});
