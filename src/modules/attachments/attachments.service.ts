import {
  Injectable,
  InternalServerErrorException,
  Logger,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { AttachmentResponseDto } from './dto/attachment-response.dto';
import {
  Attachment,
  AttachmentTargetType,
} from './entities/attachment.entity';

export const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];
export const ALLOWED_AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MIME_TO_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
export const DEFAULT_AVATAR_UPLOAD_DIR = 'public/uploads/avatars';
export const PUBLIC_AVATAR_URL_PREFIX = '/public/uploads/avatars';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    private readonly configService: ConfigService,
  ) {}

  async uploadAvatar(
    user: User,
    file: Express.Multer.File,
  ): Promise<AttachmentResponseDto> {
    const isAllowedMime = ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype);
    if (!isAllowedMime) {
      throw new UnprocessableEntityException({
        errors: {
          file: [
            `Invalid file type. Allowed types: ${ALLOWED_AVATAR_MIME_TYPES.join(', ')}`,
          ],
        },
      });
    }

    const hasExceededSize = file.size > MAX_AVATAR_FILE_SIZE;
    if (hasExceededSize) {
      throw new PayloadTooLargeException({
        errors: { file: ['file size exceeds 2MB limit'] },
      });
    }

    const originalExt = path.extname(file.originalname).toLowerCase();
    const isAllowedExt = ALLOWED_AVATAR_EXTENSIONS.includes(originalExt);
    const safeExt = isAllowedExt
      ? originalExt
      : (MIME_TO_EXTENSION_MAP[file.mimetype] ?? '.png');

    const fileId = uuidv4();
    const safeFileName = `${fileId}${safeExt}`;

    const uploadDestination = this.configService.get<string>(
      'upload.destination',
      DEFAULT_AVATAR_UPLOAD_DIR,
    );
    const destinationDir = path.isAbsolute(uploadDestination)
      ? uploadDestination
      : path.join(process.cwd(), uploadDestination);

    const hasExistingDir = fs.existsSync(destinationDir);
    if (!hasExistingDir) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    const storagePath = path.join(destinationDir, safeFileName);

    await fs.promises.writeFile(storagePath, file.buffer);

    const publicUrl = `${PUBLIC_AVATAR_URL_PREFIX}/${safeFileName}`;

    const attachment = this.attachmentRepository.create({
      id: fileId,
      targetType: AttachmentTargetType.USER,
      targetId: user.id,
      fileName: safeFileName,
      fileType: file.mimetype,
      fileSize: file.size,
      storagePath,
      url: publicUrl,
    });

    let savedAttachment: Attachment;
    try {
      savedAttachment = await this.attachmentRepository.save(attachment);
    } catch (dbError: unknown) {
      // Rollback newly written file if database persistence fails
      try {
        const hasCreatedFile = fs.existsSync(storagePath);
        if (hasCreatedFile) {
          await fs.promises.unlink(storagePath);
        }
      } catch (unlinkErr) {
        Logger.warn(
          {
            message: 'Failed to clean up newly written avatar file after DB failure',
            explanation: 'The temporary avatar file could not be unlinked after DB save error',
            guidance: 'Check filesystem permissions and disk status',
            error: String(unlinkErr),
            storagePath,
          },
          'AttachmentsService',
        );
      }

      const fatalError =
        dbError instanceof Error ? dbError : new Error(String(dbError));
      Logger.error(
        {
          message: 'Unhandled database error during avatar attachment persistence',
          explanation: 'Failed to persist attachment metadata to database',
          guidance: 'Verify database connectivity and schema health',
          errorName: fatalError.name,
          errorMessage: fatalError.message,
          rawError: dbError,
        },
        'AttachmentsService',
      );
      throw new InternalServerErrorException({
        message: 'Database persistence failed due to an internal server error',
        explanation: 'Failed to save attachment metadata to database',
        guidance: 'Check database connectivity and server logs',
      });
    }

    // Only perform orphan cleanup after new attachment is safely persisted in DB
    try {
      const previousAttachments = await this.attachmentRepository.find({
        where: {
          targetType: AttachmentTargetType.USER,
          targetId: user.id,
        },
      });

      const oldAttachments = previousAttachments.filter(
        (att) => att.id !== savedAttachment.id,
      );

      for (const prev of oldAttachments) {
        try {
          const hasPrevFile = fs.existsSync(prev.storagePath);
          if (hasPrevFile) {
            await fs.promises.unlink(prev.storagePath);
          }
        } catch (unlinkError) {
          Logger.warn(
            {
              message: 'Could not remove orphaned file during avatar cleanup',
              explanation:
                'The previous avatar file could not be unlinked from disk',
              guidance: 'Check filesystem permissions and disk status',
              error: String(unlinkError),
              storagePath: prev.storagePath,
            },
            'AttachmentsService',
          );
        }
      }

      const hasOldRecords = oldAttachments.length > 0;
      if (hasOldRecords) {
        await this.attachmentRepository.remove(oldAttachments);
      }
    } catch (cleanupError) {
      Logger.warn(
        {
          message: 'Non-fatal error during previous avatar orphan cleanup',
          error: String(cleanupError),
        },
        'AttachmentsService',
      );
    }

    return {
      attachment: {
        id: savedAttachment.id,
        url: savedAttachment.url,
        fileName: savedAttachment.fileName,
      },
    };
  }
}
