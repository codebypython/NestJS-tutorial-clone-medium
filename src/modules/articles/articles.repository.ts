import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { isDuplicateEntryError } from '../../common/utils/database-error.util';
import { rethrowAsPersistenceError } from '../../common/utils/persistence-error.util';
import { Follow } from '../profiles/entities/follow.entity';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/entities/user.entity';
import {
  DEFAULT_ARTICLES_LIMIT,
  DEFAULT_ARTICLES_OFFSET,
  FeedArticlesQueryDto,
} from './dto/feed-articles-query.dto';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { ArticleFavorite } from './entities/article-favorite.entity';
import { Article } from './entities/article.entity';
import {
  buildBaseSlug,
  SLUG_COLLISION_ATTEMPTS,
  SLUG_SUFFIX_LENGTH,
} from './utils/article-slug.util';

export interface CreateArticlePersistenceInput {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
  author: User;
}

export interface UpdateArticlePersistenceInput {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

export interface UserArticleInteractions {
  favoritedIds: Set<string>;
  followingIds: Set<string>;
}

const ARTICLES_REPOSITORY_CONTEXT = 'ArticlesRepository';

@Injectable()
export class ArticlesRepository {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(ArticleFavorite)
    private readonly favoriteRepository: Repository<ArticleFavorite>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    private readonly tagsService: TagsService,
    private readonly dataSource: DataSource,
  ) {}

  private async generateUniqueSlug(
    baseSlug: string,
    manager: EntityManager,
    excludeArticleId?: string,
  ): Promise<string> {
    const txArticleRepo = manager.getRepository(Article);
    const existing = await txArticleRepo.findOne({
      where: { slug: baseSlug },
      select: ['id', 'slug'],
    });

    if (!existing || (excludeArticleId && existing.id === excludeArticleId)) {
      return baseSlug;
    }

    for (let attempt = 0; attempt < SLUG_COLLISION_ATTEMPTS; attempt++) {
      const candidate = `${baseSlug}-${nanoid(SLUG_SUFFIX_LENGTH)}`;
      const collision = await txArticleRepo.findOne({
        where: { slug: candidate },
        select: ['id', 'slug'],
      });
      if (!collision) {
        return candidate;
      }
    }

    return `${baseSlug}-${nanoid(SLUG_SUFFIX_LENGTH * 2)}`;
  }

  private async saveArticleWithSlugRetry(
    txArticleRepo: Repository<Article>,
    article: Article,
    baseSlug: string | null,
    operation: string,
  ): Promise<Article> {
    for (let attempt = 0; attempt <= SLUG_COLLISION_ATTEMPTS; attempt++) {
      try {
        return await txArticleRepo.save(article);
      } catch (err: unknown) {
        if (baseSlug && isDuplicateEntryError(err) && attempt < SLUG_COLLISION_ATTEMPTS) {
          article.slug = `${baseSlug}-${nanoid(SLUG_SUFFIX_LENGTH)}`;
          continue;
        }
        return rethrowAsPersistenceError(err, operation, ARTICLES_REPOSITORY_CONTEXT);
      }
    }

    return rethrowAsPersistenceError(
      new Error('Exceeded slug retry attempts'),
      operation,
      ARTICLES_REPOSITORY_CONTEXT,
    );
  }

  async findBySlug(slug: string, manager?: EntityManager): Promise<Article | null> {
    const repo = manager ? manager.getRepository(Article) : this.articleRepository;
    return repo.findOne({
      where: { slug },
      relations: ['author', 'tags'],
    });
  }

  async findAll(query: ListArticlesQueryDto): Promise<[Article[], number]> {
    const limit = query.limit ?? DEFAULT_ARTICLES_LIMIT;
    const offset = query.offset ?? DEFAULT_ARTICLES_OFFSET;

    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.tags', 'tag');

    if (query.tag?.trim()) {
      qb.innerJoin('article.tags', 'filterTag', 'filterTag.name = :tag', {
        tag: query.tag.trim(),
      });
    }

    if (query.author?.trim()) {
      qb.andWhere('author.username = :author', {
        author: query.author.trim(),
      });
    }

    if (query.favorited?.trim()) {
      qb.innerJoin(ArticleFavorite, 'favFilter', 'favFilter.articleId = article.id').innerJoin(
        User,
        'favUser',
        'favUser.id = favFilter.userId AND favUser.username = :favorited',
        { favorited: query.favorited.trim() },
      );
    }

    return qb
      .orderBy('article.createdAt', 'DESC')
      .addOrderBy('article.id', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  async findFeed(followerId: string, query: FeedArticlesQueryDto): Promise<[Article[], number]> {
    const limit = query.limit ?? DEFAULT_ARTICLES_LIMIT;
    const offset = query.offset ?? DEFAULT_ARTICLES_OFFSET;

    return this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.tags', 'tag')
      .innerJoin(
        Follow,
        'follow',
        'follow.followingId = article.authorId AND follow.followerId = :followerId',
        { followerId },
      )
      .orderBy('article.createdAt', 'DESC')
      .addOrderBy('article.id', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  async findUserInteractions(
    userId: string,
    articleIds: string[],
    authorIds: string[],
  ): Promise<UserArticleInteractions> {
    if (articleIds.length === 0) {
      return { favoritedIds: new Set<string>(), followingIds: new Set<string>() };
    }

    const [favorites, follows] = await Promise.all([
      this.favoriteRepository.find({
        where: { userId, articleId: In(articleIds) },
        select: ['articleId'],
      }),
      this.followRepository.find({
        where: { followerId: userId, followingId: In(authorIds) },
        select: ['followingId'],
      }),
    ]);

    return {
      favoritedIds: new Set(favorites.map((fav) => fav.articleId)),
      followingIds: new Set(follows.map((follow) => follow.followingId)),
    };
  }

  async createWithSlugAndTags(input: CreateArticlePersistenceInput): Promise<Article> {
    return this.dataSource.transaction(async (manager) => {
      const baseSlug = buildBaseSlug(input.title);
      const slug = await this.generateUniqueSlug(baseSlug, manager);
      const tags = input.tagList?.length
        ? await this.tagsService.resolveTags(input.tagList, manager.getRepository(Tag))
        : [];

      const txArticleRepo = manager.getRepository(Article);
      const article = txArticleRepo.create({
        slug,
        title: input.title.trim(),
        description: input.description.trim(),
        body: input.body,
        authorId: input.author.id,
        author: input.author,
        favoritesCount: 0,
        tags,
      });

      return this.saveArticleWithSlugRetry(txArticleRepo, article, baseSlug, 'article creation');
    });
  }

  async updateWithSlugAndTags(
    article: Article,
    input: UpdateArticlePersistenceInput,
  ): Promise<Article> {
    return this.dataSource.transaction(async (manager) => {
      let slugBaseForRetry: string | null = null;

      if (input.title !== undefined) {
        const trimmedTitle = input.title.trim();
        if (trimmedTitle !== article.title) {
          article.title = trimmedTitle;
          slugBaseForRetry = buildBaseSlug(trimmedTitle);
          article.slug = await this.generateUniqueSlug(slugBaseForRetry, manager, article.id);
        }
      }

      if (input.description !== undefined) {
        article.description = input.description.trim();
      }

      if (input.body !== undefined) {
        article.body = input.body;
      }

      if (input.tagList !== undefined) {
        article.tags = await this.tagsService.resolveTags(
          input.tagList,
          manager.getRepository(Tag),
        );
      }

      return this.saveArticleWithSlugRetry(
        manager.getRepository(Article),
        article,
        slugBaseForRetry,
        'article update',
      );
    });
  }

  async deleteById(articleId: string): Promise<void> {
    try {
      await this.articleRepository.delete({ id: articleId });
    } catch (err: unknown) {
      rethrowAsPersistenceError(err, 'article deletion', ARTICLES_REPOSITORY_CONTEXT);
    }
  }

  async addFavorite(userId: string, article: Article): Promise<Article> {
    return this.dataSource.transaction(async (manager) => {
      const txFavRepo = manager.getRepository(ArticleFavorite);
      const txArticleRepo = manager.getRepository(Article);

      const existing = await txFavRepo.findOneBy({
        userId,
        articleId: article.id,
      });

      if (!existing) {
        try {
          await txFavRepo.insert({ userId, articleId: article.id });
          await txArticleRepo.increment({ id: article.id }, 'favoritesCount', 1);
        } catch (err: unknown) {
          if (isDuplicateEntryError(err)) {
            Logger.warn(
              {
                message: 'Concurrent favorite record creation caught',
                explanation: 'Duplicate entry prevented in race condition',
                guidance: 'Operation treated as idempotent favorite',
                error: String(err),
              },
              ARTICLES_REPOSITORY_CONTEXT,
            );
          } else {
            rethrowAsPersistenceError(err, 'article favorite', ARTICLES_REPOSITORY_CONTEXT);
          }
        }
      }

      const refreshed = await this.findBySlug(article.slug, manager);
      return refreshed ?? article;
    });
  }

  async removeFavorite(userId: string, article: Article): Promise<Article> {
    return this.dataSource.transaction(async (manager) => {
      const txFavRepo = manager.getRepository(ArticleFavorite);
      const txArticleRepo = manager.getRepository(Article);

      const deleteResult = await txFavRepo.delete({
        userId,
        articleId: article.id,
      });

      if (deleteResult.affected && deleteResult.affected > 0) {
        await txArticleRepo
          .createQueryBuilder()
          .update(Article)
          .set({
            favoritesCount: () => 'GREATEST(favorites_count - 1, 0)',
          })
          .where('id = :id', { id: article.id })
          .execute();
      }

      const refreshed = await this.findBySlug(article.slug, manager);
      return refreshed ?? article;
    });
  }
}
