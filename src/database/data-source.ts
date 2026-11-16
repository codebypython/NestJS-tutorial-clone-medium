import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../modules/users/entities/user.entity';
import { Follow } from '../modules/profiles/entities/follow.entity';
import { Attachment } from '../modules/attachments/entities/attachment.entity';

dotenv.config();

const DEFAULT_DB_PORT = 3306;

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? `${DEFAULT_DB_PORT}`, 10),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_DATABASE ?? 'conduit_db',
  entities: [User, Follow, Attachment, 'dist/**/*.entity.js'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
