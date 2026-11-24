import { MigrationInterface, QueryRunner } from 'typeorm';

export const DROP_COMMENTS_TABLE_QUERY = 'DROP TABLE `comments`';

export class CreateCommentsTable1794217000000 implements MigrationInterface {
  name = 'CreateCommentsTable1794217000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`comments\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`body\` text NOT NULL,
        \`author_id\` varchar(36) NOT NULL,
        \`article_id\` varchar(36) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_comments_author_id\` (\`author_id\`),
        INDEX \`IDX_comments_article_id_created_at\` (\`article_id\`, \`created_at\`),
        CONSTRAINT \`FK_comments_author_id\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_comments_article_id\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(DROP_COMMENTS_TABLE_QUERY);
  }
}
