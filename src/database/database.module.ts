import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host', 'localhost'),
        port: configService.get<number>('database.port', 3306),
        username: configService.get<string>('database.username', 'root'),
        password: configService.get<string>('database.password', 'root'),
        database: configService.get<string>('database.database', 'conduit_db'),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get<string>('environment') === 'development',
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
