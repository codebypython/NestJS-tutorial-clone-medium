import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';

export const TAG_NAME_LENGTH = 100;

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_tags_name', { unique: true })
  @Column({ type: 'varchar', length: TAG_NAME_LENGTH })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @ManyToMany(() => Article, (article) => article.tags)
  articles?: Article[];
}
