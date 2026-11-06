import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nJsonLoader,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';

import { configuration } from './config/configuration';
import { HealthModule } from './modules/health/health.module';
import { RedisModule } from './modules/redis/redis.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CommentsModule } from './modules/comments/comments.module';
import { TagsModule } from './modules/tags/tags.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get<string>('fallbackLanguage', 'en'),
        loader: I18nJsonLoader,
        loaderOptions: {
          path: path.join(__dirname, 'i18n'),
          watch: configService.get<string>('environment') === 'development',
        },
      }),
      resolvers: [
        new HeaderResolver(['x-custom-lang']),
        new QueryResolver(['lang']),
        new AcceptLanguageResolver(),
      ],
    }),
    HealthModule,
    RedisModule,
    UsersModule,
    AuthModule,
    ProfilesModule,
    ArticlesModule,
    CommentsModule,
    TagsModule,
    AttachmentsModule,
  ],
})
export class AppModule {}
