import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesModule } from '../articles/articles.module';
import { AuthModule } from '../auth/auth.module';
import { Follow } from '../profiles/entities/follow.entity';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Follow]),
    AuthModule,
    ArticlesModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsRepository, CommentsService],
  exports: [CommentsRepository, CommentsService, TypeOrmModule],
})
export class CommentsModule {}
