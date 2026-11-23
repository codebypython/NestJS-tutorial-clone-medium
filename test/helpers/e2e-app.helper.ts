import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { DEFAULT_API_PREFIX } from '../../src/common/constants';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';
import { ConduitValidationPipe } from '../../src/common/pipes/validation.pipe';

/**
 * Bootstraps an isolated NestJS application instance matching main.ts HTTP pipeline
 * configuration (global prefix, exception filter, and validation pipe) for E2E suites.
 */
export async function createE2eApp(): Promise<INestApplication> {
  process.env.NODE_ENV = 'test';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix(DEFAULT_API_PREFIX);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ConduitValidationPipe());

  await app.init();
  return app;
}

/**
 * Gracefully shuts down an initialized E2E NestJS application instance.
 */
export async function closeE2eApp(app: INestApplication | undefined): Promise<void> {
  if (app) {
    await app.close();
  }
}
