import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import { Readable } from 'stream';
import { LessThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AttachmentsService } from './attachments.service';
import {
  Attachment,
  AttachmentTargetType,
} from './entities/attachment.entity';

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn(),
    promises: {
      writeFile: jest.fn().mockResolvedValue(undefined),
      unlink: jest.fn().mockResolvedValue(undefined),
    },
  };
});

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let repository: Repository<Attachment>;

  const baseUser: User = {
    id: 'user-uuid-1234',
    email: 'jake@jake.jake',
    username: 'Jacob',
    password: '$2a$10$hashedpassword',
    bio: 'Test bio',
    image: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  let mockUser: User;

  const mockValidFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'avatar.png',
    encoding: '7bit',
    mimetype: 'image/png',
    buffer: Buffer.from('fake-image-bytes'),
    size: 1024,
    destination: '',
    filename: '',
    path: '',
    stream: new Readable(),
  };

  const savedCreatedAt = new Date('2026-01-02T00:00:10.000Z');
  const mockAttachment: Attachment = {
    id: 'attachment-uuid-9999',
    targetType: AttachmentTargetType.USER,
    targetId: baseUser.id,
    fileName: 'attachment-uuid-9999.png',
    fileType: 'image/png',
    fileSize: 1024,
    storagePath: 'public/uploads/avatars/attachment-uuid-9999.png',
    url: '/public/uploads/avatars/attachment-uuid-9999.png',
    createdAt: savedCreatedAt,
    updatedAt: savedCreatedAt,
  };

  const mockTxAttachmentRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTxUserRepo = {
    update: jest.fn(),
  };

  const mockTxManager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === Attachment) {
        return mockTxAttachmentRepo;
      }
      if (entity === User) {
        return mockTxUserRepo;
      }
      return null;
    }),
  };

  const mockEntityManager = {
    ...mockTxManager,
    transaction: jest.fn(
      (cb: (manager: typeof mockTxManager) => Promise<unknown>) =>
        cb(mockTxManager),
    ),
  };

  const mockAttachmentRepository = {
    find: jest.fn(),
    remove: jest.fn(),
    manager: mockEntityManager,
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'upload.destination') {
        return 'public/uploads/avatars';
      }
      if (key === 'upload.urlPrefix') {
        return '/public/uploads/avatars';
      }
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    mockUser = { ...baseUser };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        {
          provide: getRepositoryToken(Attachment),
          useValue: mockAttachmentRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
    repository = module.get<Repository<Attachment>>(
      getRepositoryToken(Attachment),
    );
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    mockTxUserRepo.update.mockResolvedValue({ affected: 1 });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('uploadAvatar', () => {
    it('should update user.image in the same transaction, save attachment, and clean up older orphans', async () => {
      const oldAttachment: Attachment = {
        ...mockAttachment,
        id: 'old-uuid-1111',
        storagePath: 'public/uploads/avatars/old-uuid-1111.png',
        createdAt: new Date('2026-01-02T00:00:05.000Z'),
        updatedAt: new Date('2026-01-02T00:00:05.000Z'),
      };
      mockAttachmentRepository.find.mockResolvedValue([oldAttachment]);
      mockAttachmentRepository.remove.mockResolvedValue([oldAttachment]);
      mockTxAttachmentRepo.create.mockReturnValue(mockAttachment);
      mockTxAttachmentRepo.save.mockResolvedValue(mockAttachment);

      const result = await service.uploadAvatar(mockUser, mockValidFile);

      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(mockTxAttachmentRepo.save).toHaveBeenCalledWith(mockAttachment);
      expect(mockTxUserRepo.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        { image: expect.stringMatching(/^\/public\/uploads\/avatars\/.+\.png$/) },
      );
      expect(mockUser.image).toMatch(/^\/public\/uploads\/avatars\/.+\.png$/);
      expect(mockAttachmentRepository.find).toHaveBeenCalledWith({
        where: {
          targetType: AttachmentTargetType.USER,
          targetId: mockUser.id,
          createdAt: LessThan(mockAttachment.createdAt),
        },
      });
      expect(fs.promises.unlink).toHaveBeenCalledWith(oldAttachment.storagePath);
      expect(mockAttachmentRepository.remove).toHaveBeenCalledWith([
        oldAttachment,
      ]);
      expect(result).toEqual({
        attachment: {
          id: mockAttachment.id,
          url: mockAttachment.url,
          fileName: mockAttachment.fileName,
        },
      });
    });

    it('should NOT delete attachments created concurrently or after the newly saved attachment', async () => {
      const olderAttachment: Attachment = {
        ...mockAttachment,
        id: 'older-uuid-1111',
        storagePath: 'public/uploads/avatars/older-uuid-1111.png',
        createdAt: new Date('2026-01-02T00:00:05.000Z'),
      };
      const concurrentAttachment: Attachment = {
        ...mockAttachment,
        id: 'concurrent-uuid-2222',
        storagePath: 'public/uploads/avatars/concurrent-uuid-2222.png',
        createdAt: new Date('2026-01-02T00:00:12.000Z'),
      };
      const sameTimestampAttachment: Attachment = {
        ...mockAttachment,
        id: 'same-ts-uuid-3333',
        storagePath: 'public/uploads/avatars/same-ts-uuid-3333.png',
        createdAt: new Date(savedCreatedAt.getTime()),
      };

      mockAttachmentRepository.find.mockResolvedValue([
        olderAttachment,
        concurrentAttachment,
        sameTimestampAttachment,
      ]);
      mockAttachmentRepository.remove.mockResolvedValue([olderAttachment]);
      mockTxAttachmentRepo.create.mockReturnValue(mockAttachment);
      mockTxAttachmentRepo.save.mockResolvedValue(mockAttachment);

      await service.uploadAvatar(mockUser, mockValidFile);

      expect(fs.promises.unlink).toHaveBeenCalledTimes(1);
      expect(fs.promises.unlink).toHaveBeenCalledWith(
        olderAttachment.storagePath,
      );
      expect(fs.promises.unlink).not.toHaveBeenCalledWith(
        concurrentAttachment.storagePath,
      );
      expect(fs.promises.unlink).not.toHaveBeenCalledWith(
        sameTimestampAttachment.storagePath,
      );
      expect(mockAttachmentRepository.remove).toHaveBeenCalledWith([
        olderAttachment,
      ]);
    });

    it('should derive url from configured upload.urlPrefix when UPLOAD_DESTINATION changes', async () => {
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: string) => {
          if (key === 'upload.destination') {
            return 'storage/custom-avatars';
          }
          if (key === 'upload.urlPrefix') {
            return '/storage/custom-avatars';
          }
          return defaultValue;
        },
      );
      mockAttachmentRepository.find.mockResolvedValue([]);
      mockTxAttachmentRepo.create.mockImplementation(
        (dto: Partial<Attachment>) => ({
          ...(dto as Attachment),
          createdAt: savedCreatedAt,
        }),
      );
      mockTxAttachmentRepo.save.mockImplementation((saved: Attachment) =>
        Promise.resolve(saved),
      );

      const result = await service.uploadAvatar(mockUser, mockValidFile);

      expect(result.attachment.url).toMatch(
        /^\/storage\/custom-avatars\/.+\.png$/,
      );
      expect(mockTxUserRepo.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        { image: result.attachment.url },
      );
    });

    it('should handle unlink error gracefully when orphan file does not exist on disk', async () => {
      const ghostAttachment: Attachment = {
        ...mockAttachment,
        id: 'ghost-uuid-2222',
        storagePath: 'public/uploads/avatars/ghost-uuid-2222.png',
        createdAt: new Date('2026-01-02T00:00:05.000Z'),
      };
      mockAttachmentRepository.find.mockResolvedValue([ghostAttachment]);
      mockAttachmentRepository.remove.mockResolvedValue([ghostAttachment]);
      mockTxAttachmentRepo.create.mockReturnValue(mockAttachment);
      mockTxAttachmentRepo.save.mockResolvedValue(mockAttachment);

      (fs.promises.unlink as jest.Mock).mockRejectedValueOnce(
        new Error('ENOENT: no such file or directory'),
      );

      const result = await service.uploadAvatar(mockUser, mockValidFile);

      expect(result.attachment.id).toBe(mockAttachment.id);
    });

    it('should fallback to correct extension from mime type when file has unwhitelisted extension', async () => {
      const fileWithUnknownExt = {
        ...mockValidFile,
        originalname: 'image.xyz',
        mimetype: 'image/jpeg',
      };
      mockAttachmentRepository.find.mockResolvedValue([]);
      mockTxAttachmentRepo.create.mockImplementation(
        (dto: Partial<Attachment>) => ({
          ...(dto as Attachment),
          createdAt: savedCreatedAt,
        }),
      );
      mockTxAttachmentRepo.save.mockImplementation((saved: Attachment) =>
        Promise.resolve(saved),
      );

      const result = await service.uploadAvatar(mockUser, fileWithUnknownExt);

      expect(result.attachment.fileName.endsWith('.jpg')).toBe(true);
    });

    it('should rollback newly written file and rethrow error when database transaction fails', async () => {
      mockTxAttachmentRepo.create.mockReturnValue(mockAttachment);
      mockTxAttachmentRepo.save.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        service.uploadAvatar(mockUser, mockValidFile),
      ).rejects.toThrow(InternalServerErrorException);

      expect(fs.promises.unlink).toHaveBeenCalledWith(
        expect.stringContaining('.png'),
      );
      expect(mockAttachmentRepository.find).not.toHaveBeenCalled();
    });

    it('should rollback newly written file when user.image update fails inside transaction', async () => {
      mockTxAttachmentRepo.create.mockReturnValue(mockAttachment);
      mockTxAttachmentRepo.save.mockResolvedValue(mockAttachment);
      mockTxUserRepo.update.mockRejectedValue(
        new Error('User update constraint failure'),
      );

      await expect(
        service.uploadAvatar(mockUser, mockValidFile),
      ).rejects.toThrow(InternalServerErrorException);

      expect(fs.promises.unlink).toHaveBeenCalledWith(
        expect.stringContaining('.png'),
      );
      expect(mockAttachmentRepository.find).not.toHaveBeenCalled();
    });
  });
});
