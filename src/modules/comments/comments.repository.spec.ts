import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { CommentsRepository } from './comments.repository';
import { Comment } from './entities/comment.entity';

describe('CommentsRepository', () => {
  let repository: CommentsRepository;

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

  const mockComment: Comment = {
    id: 1,
    body: 'His name was my name too.',
    authorId: mockUser.id,
    author: mockUser,
    articleId: 'article-uuid-1',
    article: {} as never,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockCommentRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsRepository,
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepo },
      ],
    }).compile();

    repository = module.get<CommentsRepository>(CommentsRepository);
    jest.clearAllMocks();
  });

  describe('findByIdAndArticleId', () => {
    it('should find comment by id and articleId without relations', async () => {
      mockCommentRepo.findOne.mockResolvedValue(mockComment);

      const result = await repository.findByIdAndArticleId(1, 'article-uuid-1');

      expect(mockCommentRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, articleId: 'article-uuid-1' },
      });
      expect(result).toEqual(mockComment);
    });
  });

  describe('findByArticleId', () => {
    it('should return comments ordered by createdAt and id DESC', async () => {
      mockCommentRepo.find.mockResolvedValue([mockComment]);

      const result = await repository.findByArticleId('article-uuid-1');

      expect(mockCommentRepo.find).toHaveBeenCalledWith({
        where: { articleId: 'article-uuid-1' },
        relations: ['author'],
        order: { createdAt: 'DESC', id: 'DESC' },
      });
      expect(result).toEqual([mockComment]);
    });
  });

  describe('create', () => {
    it('should persist a new comment entity', async () => {
      mockCommentRepo.create.mockReturnValue(mockComment);
      mockCommentRepo.save.mockResolvedValue(mockComment);

      const result = await repository.create({
        body: 'His name was my name too.',
        articleId: 'article-uuid-1',
        author: mockUser,
      });

      expect(mockCommentRepo.create).toHaveBeenCalledWith({
        body: 'His name was my name too.',
        articleId: 'article-uuid-1',
        authorId: mockUser.id,
        author: mockUser,
      });
      expect(result).toEqual(mockComment);
    });

    it('should rethrow database failure as InternalServerErrorException', async () => {
      mockCommentRepo.create.mockReturnValue(mockComment);
      mockCommentRepo.save.mockRejectedValue(new Error('Connection lost'));

      await expect(
        repository.create({
          body: 'Test',
          articleId: 'article-uuid-1',
          author: mockUser,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteById', () => {
    it('should delete comment by id', async () => {
      mockCommentRepo.delete.mockResolvedValue({ affected: 1 });

      await repository.deleteById(1);

      expect(mockCommentRepo.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should rethrow delete failure as InternalServerErrorException', async () => {
      mockCommentRepo.delete.mockRejectedValue(new Error('DB crash'));

      await expect(repository.deleteById(1)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
