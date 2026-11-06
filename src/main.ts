import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ConduitValidationPipe } from './common/pipes/validation.pipe';
import {
  AUTH_HEADER_NAME,
  AUTH_SCHEME,
  DEFAULT_API_PREFIX,
  SWAGGER_DOCS_PATH,
} from './common/constants';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const apiPrefix = configService.get<string>('apiPrefix', DEFAULT_API_PREFIX);

  // 1. Enable CORS for cross-origin client interaction
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 2. Set RESTful global API prefix
  app.setGlobalPrefix(apiPrefix);

  // 3. Global Filters, Interceptors, and Pipes
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(new ConduitValidationPipe());

  // 4. OpenAPI Swagger Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Conduit RealWorld API')
    .setDescription(
      'Enterprise-grade NestJS RESTful backend implementation adhering to Sun* Training Guidelines and Google TypeScript Style Guide.',
    )
    .setVersion('1.0.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: AUTH_HEADER_NAME,
        in: 'header',
        description: `Format: ${AUTH_SCHEME} <jwt_token>`,
      },
      AUTH_SCHEME,
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(SWAGGER_DOCS_PATH, app, swaggerDocument, {
    customSiteTitle: 'Conduit API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`Server listening on port ${port} with prefix /${apiPrefix}`);
  logger.log(`Swagger documentation available at /${SWAGGER_DOCS_PATH}`);
}

void bootstrap();
