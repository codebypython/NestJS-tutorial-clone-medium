import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { TagsService } from './tags.service';

describe('TagsService', () => {
  let service: TagsService;

  const mockTagRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: getRepositoryToken(Tag), useValue: mockTagRepo },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    jest.clearAllMocks();
  });

  it('should return empty array for empty or whitespace-only tagList', async () => {
    const result = await service.resolveTags(['  ', '']);
    expect(result).toEqual([]);
    expect(mockTagRepo.find).not.toHaveBeenCalled();
  });

  it('should deduplicate and reuse existing tags while creating missing tags', async () => {
    const existingTag = { id: 'tag-1', name: 'dragons', createdAt: new Date() };
    const newTag = { id: 'tag-2', name: 'training', createdAt: new Date() };

    mockTagRepo.find
      .mockResolvedValueOnce([existingTag])
      .mockResolvedValueOnce([existingTag, newTag]);
    mockTagRepo.create.mockReturnValue(newTag);
    mockTagRepo.save.mockResolvedValue(newTag);

    const result = await service.resolveTags(['dragons', ' dragons ', 'training']);

    expect(mockTagRepo.create).toHaveBeenCalledWith({ name: 'training' });
    expect(mockTagRepo.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual([existingTag, newTag]);
  });

  it('should ignore duplicate entry error on concurrent tag insert', async () => {
    const tag = { id: 'tag-1', name: 'dragons', createdAt: new Date() };
    mockTagRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([tag]);
    mockTagRepo.create.mockReturnValue(tag);
    mockTagRepo.save.mockRejectedValue({ code: 'ER_DUP_ENTRY', errno: 1062 });

    const result = await service.resolveTags(['dragons']);

    expect(result).toEqual([tag]);
  });

  it('should throw InternalServerErrorException on unexpected DB failure', async () => {
    mockTagRepo.find.mockResolvedValueOnce([]);
    mockTagRepo.create.mockReturnValue({ name: 'dragons' });
    mockTagRepo.save.mockRejectedValue(new Error('DB connection lost'));

    await expect(service.resolveTags(['dragons'])).rejects.toThrow(InternalServerErrorException);
  });
});
