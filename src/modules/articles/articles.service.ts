import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { ArticlesRepository } from './articles.repository';
import {
  ArticleDataDto,
  MultipleArticlesResponseDto,
  SingleArticleResponseDto,
} from './dto/article-response.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { FeedArticlesQueryDto } from './dto/feed-articles-query.dto';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';
import { toArticleData, toSingleArticleResponse } from './mappers/article.mapper';

@Injectable()
export class ArticlesService {
  constructor(private readonly articlesRepository: ArticlesRepository) {}

  private async findArticleOrThrow(slug: string): Promise<Article> {
    const cleanSlug = slug?.trim();
    if (!cleanSlug) {
      throw new NotFoundException({
        errors: { article: ['article not found'] },
      });
    }

    const article = await this.articlesRepository.findBySlug(cleanSlug);
    if (!article) {
      throw new NotFoundException({
        errors: { article: ['article not found'] },
      });
    }

    return article;
  }

  private verifyArticleAuthor(article: Article, currentUser: User): void {
    if (article.authorId !== currentUser.id) {
      throw new ForbiddenException({
        errors: {
          article: ['you are not authorized to perform this action'],
        },
      });
    }
  }

  private async mapArticles(
    articles: Article[],
    currentUser?: User | null,
  ): Promise<ArticleDataDto[]> {
    if (articles.length === 0) {
      return [];
    }

    if (!currentUser?.id) {
      const emptySet = new Set<string>();
      return articles.map((article) => toArticleData(article, emptySet, emptySet));
    }

    const articleIds = articles.map((article) => article.id);
    const authorIds = Array.from(new Set(articles.map((article) => article.authorId)));
    const { favoritedIds, followingIds } = await this.articlesRepository.findUserInteractions(
      currentUser.id,
      articleIds,
      authorIds,
    );

    return articles.map((article) => toArticleData(article, favoritedIds, followingIds));
  }

  private async mapSingleArticle(
    article: Article,
    currentUser?: User | null,
  ): Promise<SingleArticleResponseDto> {
    if (!currentUser?.id) {
      const emptySet = new Set<string>();
      return toSingleArticleResponse(article, emptySet, emptySet);
    }

    const { favoritedIds, followingIds } = await this.articlesRepository.findUserInteractions(
      currentUser.id,
      [article.id],
      [article.authorId],
    );

    return toSingleArticleResponse(article, favoritedIds, followingIds);
  }

  async create(dto: CreateArticleDto, currentUser: User): Promise<SingleArticleResponseDto> {
    const createdArticle = await this.articlesRepository.createWithSlugAndTags({
      title: dto.article.title,
      description: dto.article.description,
      body: dto.article.body,
      tagList: dto.article.tagList,
      author: currentUser,
    });

    return this.mapSingleArticle(createdArticle, currentUser);
  }

  async findAll(
    query: ListArticlesQueryDto,
    currentUser?: User | null,
  ): Promise<MultipleArticlesResponseDto> {
    const [articles, articlesCount] = await this.articlesRepository.findAll(query);
    return {
      articles: await this.mapArticles(articles, currentUser),
      articlesCount,
    };
  }

  async findFeed(
    query: FeedArticlesQueryDto,
    currentUser: User,
  ): Promise<MultipleArticlesResponseDto> {
    const [articles, articlesCount] = await this.articlesRepository.findFeed(currentUser.id, query);
    return {
      articles: await this.mapArticles(articles, currentUser),
      articlesCount,
    };
  }

  async findOne(slug: string, currentUser?: User | null): Promise<SingleArticleResponseDto> {
    const article = await this.findArticleOrThrow(slug);
    return this.mapSingleArticle(article, currentUser);
  }

  async update(
    slug: string,
    dto: UpdateArticleDto,
    currentUser: User,
  ): Promise<SingleArticleResponseDto> {
    const article = await this.findArticleOrThrow(slug);
    this.verifyArticleAuthor(article, currentUser);

    const payload = dto.article ?? {};
    const updatedArticle = await this.articlesRepository.updateWithSlugAndTags(article, {
      title: payload.title,
      description: payload.description,
      body: payload.body,
      tagList: payload.tagList,
    });

    return this.mapSingleArticle(updatedArticle, currentUser);
  }

  async remove(slug: string, currentUser: User): Promise<void> {
    const article = await this.findArticleOrThrow(slug);
    this.verifyArticleAuthor(article, currentUser);
    await this.articlesRepository.deleteById(article.id);
  }

  async favorite(slug: string, currentUser: User): Promise<SingleArticleResponseDto> {
    const article = await this.findArticleOrThrow(slug);
    const updatedArticle = await this.articlesRepository.addFavorite(currentUser.id, article);
    return this.mapSingleArticle(updatedArticle, currentUser);
  }

  async unfavorite(slug: string, currentUser: User): Promise<SingleArticleResponseDto> {
    const article = await this.findArticleOrThrow(slug);
    const updatedArticle = await this.articlesRepository.removeFavorite(currentUser.id, article);
    return this.mapSingleArticle(updatedArticle, currentUser);
  }
}
