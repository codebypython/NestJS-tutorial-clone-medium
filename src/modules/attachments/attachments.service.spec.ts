import {
  InternalServerErrorException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import { Repository } from 'typeorm';
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
    mkdirSync: jest.fn(),
    promises: {
      writeFile: jest.fn().mockResolvedValue(undefined),
      unlink: jest.fn().mockResolvedValue(undefined),
    },
  };
});

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let repository: Repository<Attachment>;

  const mockUser: User = {
    id: 'user-uuid-1234',
    email: 'jake@jake.jake',
    username: 'Jacob',
    password: '$2a$10$hashedpassword',
    bio: 'Test bio',
    image: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

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
    stream: null as any,
  };

  const mockAttachment: Attachment = {
    id: 'attachment-uuid-9999',
    targetType: AttachmentTargetType.USER,
    targetId: mockUser.id,
    fileName: 'attachment-uuid-9999.png',
    fileType: 'image/png',
    fileSize: 1024,
    storagePath: 'public/uploads/avatars/attachment-uuid-9999.png',
    url: '/public/uploads/avatars/attachment-uuid-9999.png',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockAttachmentRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('public/uploads/avatars'),
  };

  beforeEach(async () => {
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('uploadAvatar', () => {
    it('should throw UnprocessableEntityException when file MIME type is not allowed', async () => {
      const invalidFile = {
        ...mockValidFile,
        mimetype: 'application/pdf',
      };

      await expect(service.uploadAvatar(mockUser, invalidFile)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw PayloadTooLargeException when file exceeds 2MB limit', async () => {
      const largeFile = {
        ...mockValidFile,
        size: 3 * 1024 * 1024,
      };

      await expect(service.uploadAvatar(mockUser, largeFile)).rejects.toThrow(
        PayloadTooLargeException,
      );
    });

    it('should successfully upload file, clean up old orphans, and save attachment', async () => {
      const oldAttachment: Attachment = {
        ...mockAttachment,
        id: 'old-uuid-1111',
        storagePath: 'public/uploads/avatars/old-uuid-1111.png',
      };
      mockAttachmentRepository.find.mockResolvedValue([oldAttachment]);
      mockAttachmentRepository.remove.mockResolvedValue([oldAttachment]);
      mockAttachmentRepository.create.mockReturnValue(mockAttachment);
      mockAttachmentRepository.save.mockResolvedValue(mockAttachment);

      const result = await service.uploadAvatar(mockUser, mockValidFile);

      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(mockAttachmentRepository.find).toHaveBeenCalledWith({
        where: {
          targetType: AttachmentTargetType.USER,
          targetId: mockUser.id,
        },
      });
      expect(fs.promises.unlink).toHaveBeenCalledWith(oldAttachment.storagePath);
      expect(mockAttachmentRepository.remove).toHaveBeenCalledWith([oldAttachment]);
      expect(mockAttachmentRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        attachment: {
          id: mockAttachment.id,
          url: mockAttachment.url,
          fileName: mockAttachment.fileName,
        },
      });
    });

    it('should create upload destination directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockAttachmentRepository.find.mockResolvedValue([]);
      mockAttachmentRepository.create.mockReturnValue(mockAttachment);
      mockAttachmentRepository.save.mockResolvedValue(mockAttachment);

      await service.uploadAvatar(mockUser, mockValidFile);

      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('should handle unlink error gracefully when orphan file does not exist on disk', async () => {
      const ghostAttachment: Attachment = {
        ...mockAttachment,
        id: 'ghost-uuid-2222',
        storagePath: 'public/uploads/avatars/ghost-uuid-2222.png',
      };
      mockAttachmentRepository.find.mockResolvedValue([ghostAttachment]);
      mockAttachmentRepository.remove.mockResolvedValue([ghostAttachment]);
      mockAttachmentRepository.create.mockReturnValue(mockAttachment);
      mockAttachmentRepository.save.mockResolvedValue(mockAttachment);

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
      mockAttachmentRepository.create.mockImplementation((dto: Partial<Attachment>) => dto as Attachment);
      mockAttachmentRepository.save.mockImplementation((saved: Attachment) => Promise.resolve(saved));

      const result = await service.uploadAvatar(mockUser, fileWithUnknownExt);

      expect(result.attachment.fileName.endsWith('.jpg')).toBe(true);
    });

    it('should rollback newly written file and rethrow error when database save fails', async () => {
      mockAttachmentRepository.create.mockReturnValue(mockAttachment);
      mockAttachmentRepository.save.mockRejectedValue(
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
  });
});
