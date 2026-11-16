import { MigrationInterface, QueryRunner } from 'typeorm';

export const DROP_ARTICLE_FAVORITES_TABLE_QUERY = 'DROP TABLE `article_favorites`';
export const DROP_ARTICLE_TAGS_TABLE_QUERY = 'DROP TABLE `article_tags`';
export const DROP_TAGS_TABLE_QUERY = 'DROP TABLE `tags`';
export const DROP_ARTICLES_TABLE_QUERY = 'DROP TABLE `articles`';

export class CreateArticlesAndTagsTables1794216000000 implements MigrationInterface {
  name = 'CreateArticlesAndTagsTables1794216000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`articles\` (
        \`id\` varchar(36) NOT NULL,
        \`slug\` varchar(255) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NOT NULL,
        \`body\` text NOT NULL,
        \`author_id\` varchar(36) NOT NULL,
        \`favorites_count\` int NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_articles_slug\` (\`slug\`),
        INDEX \`IDX_articles_author_id\` (\`author_id\`),
        INDEX \`IDX_articles_created_at\` (\`created_at\`),
        CONSTRAINT \`FK_articles_author_id\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`tags\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(100) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_tags_name\` (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`article_tags\` (
        \`article_id\` varchar(36) NOT NULL,
        \`tag_id\` varchar(36) NOT NULL,
        PRIMARY KEY (\`article_id\`, \`tag_id\`),
        INDEX \`IDX_article_tags_article_id\` (\`article_id\`),
        INDEX \`IDX_article_tags_tag_id\` (\`tag_id\`),
        CONSTRAINT \`FK_article_tags_article_id\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_article_tags_tag_id\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tags\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`article_favorites\` (
        \`user_id\` varchar(36) NOT NULL,
        \`article_id\` varchar(36) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`user_id\`, \`article_id\`),
        INDEX \`IDX_article_favorites_user_id\` (\`user_id\`),
        INDEX \`IDX_article_favorites_article_id\` (\`article_id\`),
        CONSTRAINT \`FK_article_favorites_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_article_favorites_article_id\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(DROP_ARTICLE_FAVORITES_TABLE_QUERY);
    await queryRunner.query(DROP_ARTICLE_TAGS_TABLE_QUERY);
    await queryRunner.query(DROP_TAGS_TABLE_QUERY);
    await queryRunner.query(DROP_ARTICLES_TABLE_QUERY);
  }
}
