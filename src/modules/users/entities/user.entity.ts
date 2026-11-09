import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const USER_EMAIL_LENGTH = 255;
export const USER_USERNAME_LENGTH = 50;
export const USER_PASSWORD_LENGTH = 255;
export const USER_IMAGE_URL_LENGTH = 500;

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_users_email', { unique: true })
  @Column({ type: 'varchar', length: USER_EMAIL_LENGTH })
  email!: string;

  @Index('IDX_users_username', { unique: true })
  @Column({ type: 'varchar', length: USER_USERNAME_LENGTH })
  username!: string;

  @Column({ type: 'varchar', length: USER_PASSWORD_LENGTH })
  password!: string;

  @Column({ type: 'text', nullable: true, default: null })
  bio!: string | null;

  @Column({
    type: 'varchar',
    length: USER_IMAGE_URL_LENGTH,
    nullable: true,
    default: null,
  })
  image!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
