import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export const FOLLOW_ID_LENGTH = 36;

@Entity('follows')
@Index('IDX_follows_follower_id', ['followerId'])
@Index('IDX_follows_following_id', ['followingId'])
export class Follow {
  @PrimaryColumn({ name: 'follower_id', type: 'varchar', length: FOLLOW_ID_LENGTH })
  followerId!: string;

  @PrimaryColumn({ name: 'following_id', type: 'varchar', length: FOLLOW_ID_LENGTH })
  followingId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following!: User;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}
