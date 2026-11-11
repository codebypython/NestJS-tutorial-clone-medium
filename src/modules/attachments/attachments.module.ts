import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AuthModule } from '../auth/auth.module';
import { AttachmentsController } from './attachments.controller';
import {
  AttachmentsService,
  DEFAULT_AVATAR_UPLOAD_DIR,
} from './attachments.service';
import { Attachment } from './entities/attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    AuthModule,
    ConfigModule,
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [AttachmentsService, TypeOrmModule],
})
export class AttachmentsModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const uploadDestination = this.configService.get<string>(
      'upload.destination',
      DEFAULT_AVATAR_UPLOAD_DIR,
    );
    const uploadDir = path.isAbsolute(uploadDestination)
      ? uploadDestination
      : path.join(process.cwd(), uploadDestination);

    const hasUploadDir = fs.existsSync(uploadDir);
    if (!hasUploadDir) {
      fs.mkdirSync(uploadDir, { recursive: true });
      Logger.log(`Created upload directory: ${uploadDir}`, 'AttachmentsModule');
    }

    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      Logger.log(
        `Confirmed write permissions for directory: ${uploadDir}`,
        'AttachmentsModule',
      );
    } catch (writeErr) {
      Logger.warn(
        {
          message: 'Directory write permission verification failed',
          explanation: 'Unable to verify write permissions on upload directory',
          guidance: 'Verify folder ownership and permissions',
          error: String(writeErr),
          uploadDir,
        },
        'AttachmentsModule',
      );
    }
  }
}
