import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ConduitValidationPipe } from '../src/common/pipes/validation.pipe';

describe('Application Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ConduitValidationPipe());

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api/hello (GET) - Default English greeting', async () => {
    const response = await request(app.getHttpServer()).get('/api/hello').expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('language', 'en');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('/api/hello (GET) - Localized Vietnamese greeting via header', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/hello')
      .set('x-custom-lang', 'vi')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Chào mừng đến với Conduit RealWorld API');
    expect(response.body).toHaveProperty('language', 'vi');
  });

  it('/api/hello (GET) - Localized Vietnamese greeting via query param', async () => {
    const response = await request(app.getHttpServer()).get('/api/hello?lang=vi').expect(200);

    expect(response.body).toHaveProperty('message', 'Chào mừng đến với Conduit RealWorld API');
    expect(response.body).toHaveProperty('language', 'vi');
  });

  it('/api/non-existent-endpoint (GET) - Returns Conduit format 404', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/non-existent-endpoint')
      .expect(404);

    expect(response.body).toHaveProperty('errors');
  });
});
