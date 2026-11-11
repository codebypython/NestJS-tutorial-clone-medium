import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AttachmentTargetType {
  USER = 'User',
  ARTICLE = 'Article',
}

export const ATTACHMENT_TARGET_TYPE_LENGTH = 50;
export const ATTACHMENT_TARGET_ID_LENGTH = 36;
export const ATTACHMENT_FILE_NAME_LENGTH = 255;
export const ATTACHMENT_FILE_TYPE_LENGTH = 100;
export const ATTACHMENT_STORAGE_PATH_LENGTH = 500;
export const ATTACHMENT_URL_LENGTH = 500;

@Entity('attachments')
@Index('IDX_attachments_target', ['targetType', 'targetId'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'target_type',
    type: 'varchar',
    length: ATTACHMENT_TARGET_TYPE_LENGTH,
  })
  targetType!: string;

  @Column({
    name: 'target_id',
    type: 'varchar',
    length: ATTACHMENT_TARGET_ID_LENGTH,
  })
  targetId!: string;

  @Column({
    name: 'file_name',
    type: 'varchar',
    length: ATTACHMENT_FILE_NAME_LENGTH,
  })
  fileName!: string;

  @Column({
    name: 'file_type',
    type: 'varchar',
    length: ATTACHMENT_FILE_TYPE_LENGTH,
  })
  fileType!: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize!: number;

  @Column({
    name: 'storage_path',
    type: 'varchar',
    length: ATTACHMENT_STORAGE_PATH_LENGTH,
  })
  storagePath!: string;

  @Column({ name: 'url', type: 'varchar', length: ATTACHMENT_URL_LENGTH })
  url!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
