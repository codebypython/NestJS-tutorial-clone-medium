import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Article, ARTICLE_ID_LENGTH } from './article.entity';

@Entity('article_favorites')
@Index('IDX_article_favorites_user_id', ['userId'])
@Index('IDX_article_favorites_article_id', ['articleId'])
export class ArticleFavorite {
  @PrimaryColumn({ name: 'user_id', type: 'varchar', length: ARTICLE_ID_LENGTH })
  userId!: string;

  @PrimaryColumn({
    name: 'article_id',
    type: 'varchar',
    length: ARTICLE_ID_LENGTH,
  })
  articleId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article!: Article;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}
