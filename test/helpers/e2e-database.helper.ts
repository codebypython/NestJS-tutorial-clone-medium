import { INestApplication } from '@nestjs/common';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { REDIS_CLIENT } from '../../src/modules/redis/redis.constants';

const RESERVED_MIGRATIONS_TABLE = 'migrations';
const PRODUCTION_DATABASE_NAME = 'conduit_db';

/**
 * Prevents E2E bootstrap and truncation helpers from operating on a non-test schema.
 */
export function assertSafeTestDatabaseName(databaseName: unknown): asserts databaseName is string {
  if (
    typeof databaseName !== 'string' ||
    !databaseName.endsWith('_test') ||
    databaseName === PRODUCTION_DATABASE_NAME
  ) {
    throw new Error(
      `Refusing E2E database operation against non-test database: "${String(databaseName)}"`,
    );
  }
}

/**
 * Collects all domain and join table names managed by TypeORM metadata.
 */
function collectDomainTableNames(dataSource: DataSource): string[] {
  const tableNames = new Set<string>();

  for (const metadata of dataSource.entityMetadatas) {
    if (metadata.tableName !== RESERVED_MIGRATIONS_TABLE) {
      tableNames.add(metadata.tableName);
    }
    for (const relation of metadata.manyToManyRelations) {
      if (relation.joinTableName && relation.joinTableName !== RESERVED_MIGRATIONS_TABLE) {
        tableNames.add(relation.joinTableName);
      }
    }
  }

  return Array.from(tableNames);
}

/**
 * Truncates every application table in the isolated test database and flushes the
 * dedicated Redis test DB index so each test case executes with zero leftover state.
 */
export async function truncateDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  assertSafeTestDatabaseName(dataSource.options.database);

  const tableNames = collectDomainTableNames(dataSource);
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0;');
    for (const tableName of tableNames) {
      await queryRunner.query(`TRUNCATE TABLE \`${tableName}\`;`);
    }
  } finally {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1;').catch(() => undefined);
    await queryRunner.release();
  }

  const redisClient = app.get<Redis>(REDIS_CLIENT);
  const redisDbIndex = redisClient.options.db;
  if (typeof redisDbIndex === 'number' && redisDbIndex > 0) {
    await redisClient.flushdb();
  }
}
