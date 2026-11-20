import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/entities/user.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import {
  MultipleCommentsResponseDto,
  SingleCommentResponseDto,
} from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CommentsService;

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'jake@test.com',
    username: 'jake',
    password: 'hashed_password',
    bio: null,
    image: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockSingleResponse: SingleCommentResponseDto = {
    comment: {
      id: 1,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      body: 'His name was my name too.',
      author: {
        username: 'jake',
        bio: null,
        image: null,
        following: false,
      },
    },
  };

  const mockMultipleResponse: MultipleCommentsResponseDto = {
    comments: [mockSingleResponse.comment],
  };

  const mockCommentsService = {
    addComment: jest.fn(),
    getComments: jest.fn(),
    deleteComment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get<CommentsService>(CommentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('addComment', () => {
    it('should delegate to commentsService.addComment', async () => {
      const dto: CreateCommentDto = {
        comment: { body: 'His name was my name too.' },
      };
      mockCommentsService.addComment.mockResolvedValue(mockSingleResponse);

      const result = await controller.addComment('article-slug', dto, mockUser);

      expect(mockCommentsService.addComment).toHaveBeenCalledWith('article-slug', dto, mockUser);
      expect(result).toEqual(mockSingleResponse);
    });
  });

  describe('getComments', () => {
    it('should delegate to commentsService.getComments', async () => {
      mockCommentsService.getComments.mockResolvedValue(mockMultipleResponse);

      const result = await controller.getComments('article-slug', mockUser);

      expect(mockCommentsService.getComments).toHaveBeenCalledWith('article-slug', mockUser);
      expect(result).toEqual(mockMultipleResponse);
    });
  });

  describe('deleteComment', () => {
    it('should delegate to commentsService.deleteComment', async () => {
      mockCommentsService.deleteComment.mockResolvedValue(undefined);

      await controller.deleteComment('article-slug', 1, mockUser);

      expect(mockCommentsService.deleteComment).toHaveBeenCalledWith('article-slug', 1, mockUser);
    });
  });
});
