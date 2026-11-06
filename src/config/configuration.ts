export interface AppConfig {
  port: number;
  environment: string;
  apiPrefix: string;
  fallbackLanguage: string;
  database: {
    type: 'mysql';
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export const configuration = (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  environment: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api',
  fallbackLanguage: process.env.FALLBACK_LANGUAGE ?? 'en',
  database: {
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    database: process.env.DB_DATABASE ?? 'conduit_db',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'conduit-secret-key-development-environment',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  },
});
