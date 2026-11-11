import { MigrationInterface, QueryRunner } from 'typeorm';

export const DROP_ATTACHMENTS_TABLE_QUERY = 'DROP TABLE `attachments`';
export const DROP_FOLLOWS_TABLE_QUERY = 'DROP TABLE `follows`';

export class CreateFollowsAndAttachmentsTables1794215000000
  implements MigrationInterface
{
  name = 'CreateFollowsAndAttachmentsTables1794215000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`follows\` (
        \`follower_id\` varchar(36) NOT NULL,
        \`following_id\` varchar(36) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`follower_id\`, \`following_id\`),
        INDEX \`IDX_follows_follower_id\` (\`follower_id\`),
        INDEX \`IDX_follows_following_id\` (\`following_id\`),
        CONSTRAINT \`FK_follows_follower_id\` FOREIGN KEY (\`follower_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_follows_following_id\` FOREIGN KEY (\`following_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`attachments\` (
        \`id\` varchar(36) NOT NULL,
        \`target_type\` varchar(50) NOT NULL,
        \`target_id\` varchar(36) NOT NULL,
        \`file_name\` varchar(255) NOT NULL,
        \`file_type\` varchar(100) NOT NULL,
        \`file_size\` bigint NOT NULL,
        \`storage_path\` varchar(500) NOT NULL,
        \`url\` varchar(500) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_attachments_target\` (\`target_type\`, \`target_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(DROP_ATTACHMENTS_TABLE_QUERY);
    await queryRunner.query(DROP_FOLLOWS_TABLE_QUERY);
  }
}
