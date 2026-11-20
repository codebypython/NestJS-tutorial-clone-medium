import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ArticlesRepository } from '../articles/articles.repository';
import { User } from '../users/entities/user.entity';
import { CommentsRepository } from './comments.repository';
import {
  MultipleCommentsResponseDto,
  SingleCommentResponseDto,
} from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { toCommentData, toSingleCommentResponse } from './mappers/comment.mapper';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly articlesRepository: ArticlesRepository,
  ) {}

  private async findArticleOrThrow(slug: string) {
    const article = await this.articlesRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundException({
        errors: { article: ['article not found'] },
      });
    }
    return article;
  }

  async addComment(
    slug: string,
    dto: CreateCommentDto,
    currentUser: User,
  ): Promise<SingleCommentResponseDto> {
    const article = await this.findArticleOrThrow(slug);

    const comment = await this.commentsRepository.create({
      body: dto.comment.body,
      articleId: article.id,
      author: currentUser,
    });

    const emptyFollowingSet = new Set<string>();
    return toSingleCommentResponse(comment, emptyFollowingSet);
  }

  async getComments(
    slug: string,
    currentUser?: User | null,
  ): Promise<MultipleCommentsResponseDto> {
    const article = await this.findArticleOrThrow(slug);
    const comments = await this.commentsRepository.findByArticleId(article.id);

    if (comments.length === 0) {
      return { comments: [] };
    }

    let followingIds = new Set<string>();
    if (currentUser?.id) {
      const authorIds = Array.from(new Set(comments.map((c) => c.authorId)));
      followingIds = await this.commentsRepository.findFollowingAuthorIds(
        currentUser.id,
        authorIds,
      );
    }

    return {
      comments: comments.map((comment) => toCommentData(comment, followingIds)),
    };
  }

  async deleteComment(slug: string, id: number, currentUser: User): Promise<void> {
    const article = await this.findArticleOrThrow(slug);
    const comment = await this.commentsRepository.findById(id);

    if (!comment || comment.articleId !== article.id) {
      throw new NotFoundException({
        errors: { comment: ['comment not found'] },
      });
    }

    const isCommentAuthor = comment.authorId === currentUser.id;
    const isArticleAuthor = article.authorId === currentUser.id;

    if (!isCommentAuthor && !isArticleAuthor) {
      throw new ForbiddenException({
        errors: {
          comment: ['you are not authorized to delete this comment'],
        },
      });
    }

    await this.commentsRepository.deleteById(id);
  }
}
