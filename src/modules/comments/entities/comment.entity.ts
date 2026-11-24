import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';
import { User } from '../../users/entities/user.entity';

export const COMMENT_AUTHOR_ID_LENGTH = 36;
export const COMMENT_ARTICLE_ID_LENGTH = 36;

@Entity('comments')
@Index('IDX_comments_author_id', ['authorId'])
@Index('IDX_comments_article_id_created_at', ['articleId', 'createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'author_id', type: 'varchar', length: COMMENT_AUTHOR_ID_LENGTH })
  authorId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ name: 'article_id', type: 'varchar', length: COMMENT_ARTICLE_ID_LENGTH })
  articleId!: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article!: Article;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
