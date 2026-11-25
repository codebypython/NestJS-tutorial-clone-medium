import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { rethrowAsPersistenceError } from '../../common/utils/persistence-error.util';
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
  ) {}

  async findByIdAndArticleId(id: number, articleId: string): Promise<Comment | null> {
    return this.commentRepository.findOne({
      where: { id, articleId },
    });
  }

  async findByArticleId(articleId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { articleId },
      relations: ['author'],
      order: { createdAt: 'DESC', id: 'DESC' },
    });
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
