import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/entities/user.entity';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { AttachmentResponseDto } from './dto/attachment-response.dto';

describe('AttachmentsController', () => {
  let controller: AttachmentsController;
  let service: AttachmentsService;

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
    buffer: Buffer.from('fake-bytes'),
    size: 512,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const mockAttachmentResponse: AttachmentResponseDto = {
    attachment: {
      id: 'attachment-uuid-9999',
      url: '/public/uploads/avatars/avatar.png',
      fileName: 'avatar.png',
    },
  };

  const mockAttachmentsService = {
    uploadAvatar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [
        {
          provide: AttachmentsService,
          useValue: mockAttachmentsService,
        },
      ],
    }).compile();

    controller = module.get<AttachmentsController>(AttachmentsController);
    service = module.get<AttachmentsService>(AttachmentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('uploadAvatar', () => {
    it('should delegate to attachmentsService.uploadAvatar and return result', async () => {
      mockAttachmentsService.uploadAvatar.mockResolvedValue(
        mockAttachmentResponse,
      );

      const result = await controller.uploadAvatar(mockUser, mockValidFile);

      expect(mockAttachmentsService.uploadAvatar).toHaveBeenCalledWith(
        mockUser,
        mockValidFile,
      );
      expect(result).toEqual(mockAttachmentResponse);
    });

    it('should throw UnprocessableEntityException when file is missing', async () => {
      await expect(
        controller.uploadAvatar(mockUser, undefined),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
