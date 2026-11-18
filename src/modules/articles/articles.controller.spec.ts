import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/entities/user.entity';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { MultipleArticlesResponseDto, SingleArticleResponseDto } from './dto/article-response.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { FeedArticlesQueryDto } from './dto/feed-articles-query.dto';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

describe('ArticlesController', () => {
  let controller: ArticlesController;
  let service: ArticlesService;

  const mockUser: User = {
    id: 'user-uuid-1234',
    email: 'jake@jake.jake',
    username: 'Jacob',
    password: '$2a$10$hashedpassword',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockSingleResponse: SingleArticleResponseDto = {
    article: {
      slug: 'how-to-train-your-dragon',
      title: 'How to train your dragon',
      description: 'Ever wonder how?',
      body: 'It takes a Jacobian',
      tagList: ['dragons', 'training'],
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      favorited: false,
      favoritesCount: 0,
      author: {
        username: 'Jacob',
        bio: 'Test bio',
        image: 'https://example.com/avatar.jpg',
        following: false,
      },
    },
  };

  const mockMultipleResponse: MultipleArticlesResponseDto = {
    articles: [mockSingleResponse.article],
    articlesCount: 1,
  };

  const mockArticlesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findFeed: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    favorite: jest.fn(),
    unfavorite: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: mockArticlesService,
        },
      ],
    }).compile();

    controller = module.get<ArticlesController>(ArticlesController);
    service = module.get<ArticlesService>(ArticlesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should delegate to articlesService.findAll', async () => {
      const query: ListArticlesQueryDto = { tag: 'dragons', limit: 10 };
      mockArticlesService.findAll.mockResolvedValue(mockMultipleResponse);

      const result = await controller.findAll(query, mockUser);

      expect(mockArticlesService.findAll).toHaveBeenCalledWith(query, mockUser);
      expect(result).toEqual(mockMultipleResponse);
    });
  });

  describe('findFeed', () => {
    it('should delegate to articlesService.findFeed', async () => {
      const query: FeedArticlesQueryDto = { limit: 10, offset: 0 };
      mockArticlesService.findFeed.mockResolvedValue(mockMultipleResponse);

      const result = await controller.findFeed(query, mockUser);

      expect(mockArticlesService.findFeed).toHaveBeenCalledWith(query, mockUser);
      expect(result).toEqual(mockMultipleResponse);
    });
  });

  describe('findOne', () => {
    it('should delegate to articlesService.findOne', async () => {
      mockArticlesService.findOne.mockResolvedValue(mockSingleResponse);

      const result = await controller.findOne('how-to-train-your-dragon', mockUser);

      expect(mockArticlesService.findOne).toHaveBeenCalledWith(
        'how-to-train-your-dragon',
        mockUser,
      );
      expect(result).toEqual(mockSingleResponse);
    });
  });

  describe('create', () => {
    it('should delegate to articlesService.create', async () => {
      const dto: CreateArticleDto = {
        article: {
          title: 'How to train your dragon',
          description: 'Ever wonder how?',
          body: 'It takes a Jacobian',
          tagList: ['dragons', 'training'],
        },
      };
      mockArticlesService.create.mockResolvedValue(mockSingleResponse);

      const result = await controller.create(dto, mockUser);

      expect(mockArticlesService.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockSingleResponse);
    });
  });

  describe('update', () => {
    it('should delegate to articlesService.update', async () => {
      const dto: UpdateArticleDto = {
        article: { title: 'Updated Title' },
      };
      mockArticlesService.update.mockResolvedValue(mockSingleResponse);

      const result = await controller.update('how-to-train-your-dragon', dto, mockUser);

      expect(mockArticlesService.update).toHaveBeenCalledWith(
        'how-to-train-your-dragon',
        dto,
        mockUser,
      );
      expect(result).toEqual(mockSingleResponse);
    });
  });

  describe('remove', () => {
    it('should delegate to articlesService.remove', async () => {
      mockArticlesService.remove.mockResolvedValue(undefined);

      await controller.remove('how-to-train-your-dragon', mockUser);

      expect(mockArticlesService.remove).toHaveBeenCalledWith('how-to-train-your-dragon', mockUser);
    });
  });

  describe('favorite', () => {
    it('should delegate to articlesService.favorite', async () => {
      const favorited = {
        article: {
          ...mockSingleResponse.article,
          favorited: true,
          favoritesCount: 1,
        },
      };
      mockArticlesService.favorite.mockResolvedValue(favorited);

      const result = await controller.favorite('how-to-train-your-dragon', mockUser);

      expect(mockArticlesService.favorite).toHaveBeenCalledWith(
        'how-to-train-your-dragon',
        mockUser,
      );
      expect(result).toEqual(favorited);
    });
  });

  describe('unfavorite', () => {
    it('should delegate to articlesService.unfavorite', async () => {
      mockArticlesService.unfavorite.mockResolvedValue(mockSingleResponse);

      const result = await controller.unfavorite('how-to-train-your-dragon', mockUser);

      expect(mockArticlesService.unfavorite).toHaveBeenCalledWith(
        'how-to-train-your-dragon',
        mockUser,
      );
      expect(result).toEqual(mockSingleResponse);
    });
  });
});
