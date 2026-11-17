import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Follow } from '../profiles/entities/follow.entity';
import { Tag } from '../tags/entities/tag.entity';
import { TagsModule } from '../tags/tags.module';
import { ArticlesController } from './articles.controller';
import { ArticlesRepository } from './articles.repository';
import { ArticlesService } from './articles.service';
import { ArticleFavorite } from './entities/article-favorite.entity';
import { Article } from './entities/article.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, ArticleFavorite, Follow, Tag]),
    AuthModule,
    TagsModule,
  ],
  controllers: [ArticlesController],
  providers: [ArticlesRepository, ArticlesService],
  exports: [ArticlesRepository, ArticlesService, TypeOrmModule],
})
export class ArticlesModule {}
