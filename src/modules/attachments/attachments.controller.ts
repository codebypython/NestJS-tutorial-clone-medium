import {
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_SCHEME } from '../../common/constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import {
  ALLOWED_AVATAR_MIME_TYPES,
  AttachmentsService,
  MAX_AVATAR_FILE_SIZE,
} from './attachments.service';
import { AttachmentResponseDto } from './dto/attachment-response.dto';

@ApiTags('Attachments')
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar image' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (JPEG, PNG, WebP up to 2MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Avatar uploaded successfully.',
    type: AttachmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Validation failed or file type not allowed.',
  })
  @ApiResponse({
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    description: 'File size exceeds 2MB limit.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_AVATAR_FILE_SIZE,
      },
      fileFilter: (_req, file, callback) => {
        const isAllowedMime = ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype);
        if (!isAllowedMime) {
          return callback(
            new UnprocessableEntityException({
              errors: {
                file: [
                  `Invalid file type. Allowed types: ${ALLOWED_AVATAR_MIME_TYPES.join(', ')}`,
                ],
              },
            }),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<AttachmentResponseDto> {
    if (!file) {
      throw new UnprocessableEntityException({
        errors: { file: ['file is required'] },
      });
    }
    return this.attachmentsService.uploadAvatar(user, file);
  }
}
