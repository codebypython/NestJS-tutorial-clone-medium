import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { ArticleFavorite } from '../src/modules/articles/entities/article-favorite.entity';
import { Article } from '../src/modules/articles/entities/article.entity';
import { Attachment } from '../src/modules/attachments/entities/attachment.entity';
import { Comment } from '../src/modules/comments/entities/comment.entity';
import { Follow } from '../src/modules/profiles/entities/follow.entity';
import { Tag } from '../src/modules/tags/entities/tag.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { assertSafeTestDatabaseName } from './helpers/e2e-database.helper';

const DEFAULT_MYSQL_PORT = 3306;

/**
 * Ensures the isolated MySQL test database exists and executes all manual TypeORM
 * migrations before any E2E test suite runs.
 */
export default async function globalSetup(): Promise<void> {
  process.env.NODE_ENV = 'test';
  dotenv.config({
    path: path.resolve(__dirname, '../.env.test'),
    override: true,
  });

  const host = process.env.DB_HOST ?? 'localhost';
  const port = parseInt(process.env.DB_PORT ?? `${DEFAULT_MYSQL_PORT}`, 10);
  const user = process.env.DB_USERNAME ?? 'root';
  const password = process.env.DB_PASSWORD ?? 'root';
  const database = process.env.DB_DATABASE;

  assertSafeTestDatabaseName(database);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    );
  } finally {
    await connection.end();
  }

  const dataSource = new DataSource({
    type: 'mysql',
    host,
    port,
    username: user,
    password,
    database,
    entities: [User, Follow, Attachment, Article, ArticleFavorite, Tag, Comment],
    migrations: [path.resolve(__dirname, '../src/database/migrations/*{.ts,.js}')],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}
