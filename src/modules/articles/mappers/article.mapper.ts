import { ArticleDataDto, SingleArticleResponseDto } from '../dto/article-response.dto';
import { Article } from '../entities/article.entity';

export function toArticleData(
  article: Article,
  favoritedArticleIds: Set<string>,
  followingAuthorIds: Set<string>,
): ArticleDataDto {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: (article.tags ?? []).map((tag) => tag.name).sort(),
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: favoritedArticleIds.has(article.id),
    favoritesCount: article.favoritesCount,
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following: followingAuthorIds.has(article.authorId),
    },
  };
}

export function toSingleArticleResponse(
  article: Article,
  favoritedArticleIds: Set<string>,
  followingAuthorIds: Set<string>,
): SingleArticleResponseDto {
  return {
    article: toArticleData(article, favoritedArticleIds, followingAuthorIds),
  };
}
