import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { rethrowAsPersistenceError } from '../../common/utils/persistence-error.util';
import { Follow } from '../profiles/entities/follow.entity';
import { User } from '../users/entities/user.entity';
import { Comment } from './entities/comment.entity';

export interface CreateCommentPersistenceInput {
  body: string;
  articleId: string;
  author: User;
}

const COMMENTS_REPOSITORY_CONTEXT = 'CommentsRepository';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  async findById(id: number): Promise<Comment | null> {
    return this.commentRepository.findOne({
      where: { id },
      relations: ['author', 'article'],
    });
  }

  async findByArticleId(articleId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { articleId },
      relations: ['author'],
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  async findFollowingAuthorIds(
    followerId: string,
    authorIds: string[],
  ): Promise<Set<string>> {
    if (authorIds.length === 0) {
      return new Set<string>();
    }

    const follows = await this.followRepository.find({
      where: {
        followerId,
        followingId: In(authorIds),
      },
      select: ['followingId'],
    });

    return new Set(follows.map((follow) => follow.followingId));
  }

  async create(input: CreateCommentPersistenceInput): Promise<Comment> {
    try {
      const comment = this.commentRepository.create({
        body: input.body.trim(),
        articleId: input.articleId,
        authorId: input.author.id,
        author: input.author,
      });
      return await this.commentRepository.save(comment);
    } catch (err: unknown) {
      rethrowAsPersistenceError(err, 'comment creation', COMMENTS_REPOSITORY_CONTEXT);
    }
  }

  async deleteById(id: number): Promise<void> {
    try {
      await this.commentRepository.delete({ id });
    } catch (err: unknown) {
      rethrowAsPersistenceError(err, 'comment deletion', COMMENTS_REPOSITORY_CONTEXT);
    }
  }
}
