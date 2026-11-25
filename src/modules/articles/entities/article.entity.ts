import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tag } from '../../tags/entities/tag.entity';
import { User } from '../../users/entities/user.entity';

export const ARTICLE_ID_LENGTH = 36;
export const ARTICLE_SLUG_LENGTH = 255;
export const ARTICLE_TITLE_LENGTH = 255;

export type ArticleSummary = Pick<Article, 'id' | 'authorId'>;

@Entity('articles')
@Index('IDX_articles_author_id', ['authorId'])
@Index('IDX_articles_created_at', ['createdAt'])
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_articles_slug', { unique: true })
  @Column({ type: 'varchar', length: ARTICLE_SLUG_LENGTH })
  slug!: string;

  @Column({ type: 'varchar', length: ARTICLE_TITLE_LENGTH })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'author_id', type: 'varchar', length: ARTICLE_ID_LENGTH })
  authorId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ name: 'favorites_count', type: 'int', default: 0 })
  favoritesCount!: number;

  @ManyToMany(() => Tag, (tag) => tag.articles, { cascade: false })
  @JoinTable({
    name: 'article_tags',
    joinColumn: { name: 'article_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
