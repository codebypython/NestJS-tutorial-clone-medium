import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ConduitValidationPipe } from '../src/common/pipes/validation.pipe';

describe('Authentication & User Endpoints (e2e)', () => {
  let app: INestApplication;

  const timestamp = Date.now();
  const testUser = {
    email: `jake_${timestamp}@jake.jake`,
    username: `jake_${timestamp}`,
    password: 'securepassword123',
  };

  let authToken: string;

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
    await app.close();
  });

  describe('POST /api/users (Registration)', () => {
    it('should register a new user and return HTTP 201 with wrapped user profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          user: {
            email: testUser.email,
            username: testUser.username,
            password: testUser.password,
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('username', testUser.username);
      expect(response.body.user).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('bio', null);
      expect(response.body.user).toHaveProperty('image', null);
      expect(typeof response.body.user.token).toBe('string');

      authToken = response.body.user.token;
    });

    it('should reject registration when email or username already exists with HTTP 422', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          user: {
            email: testUser.email,
            username: testUser.username,
            password: testUser.password,
          },
        })
        .expect(422);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('email');
      expect(response.body.errors.email).toEqual(['has already been taken']);
      expect(response.body.errors).toHaveProperty('username');
      expect(response.body.errors.username).toEqual(['has already been taken']);
    });

    it('should reject registration when password is shorter than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          user: {
            email: `valid_${Date.now()}@example.com`,
            username: `valid_${Date.now()}`,
            password: 'short',
          },
        })
        .expect(422);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('password');
    });
  });

  describe('POST /api/users/login (Authentication)', () => {
    it('should authenticate user and return HTTP 200 with new JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({
          user: {
            email: testUser.email,
            password: testUser.password,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('username', testUser.username);
      expect(response.body.user).toHaveProperty('token');
    });

    it('should return HTTP 422 when password is incorrect', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({
          user: {
            email: testUser.email,
            password: 'completelywrongpassword',
          },
        })
        .expect(422);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('credentials');
      expect(response.body.errors.credentials).toEqual([
        'invalid email or password',
      ]);
    });

    it('should return HTTP 422 when email does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({
          user: {
            email: 'nonexistent_account@example.com',
            password: testUser.password,
          },
        })
        .expect(422);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('credentials');
    });
  });

  describe('GET /api/user (Get Current User)', () => {
    it('should return current user with Authorization: Token <jwt> header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/user')
        .set('Authorization', `Token ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('username', testUser.username);
      expect(response.body.user).toHaveProperty('token', authToken);
    });

    it('should return current user with Authorization: Bearer <jwt> header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should reject request with HTTP 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/api/user').expect(401);
    });

    it('should reject request with HTTP 401 when invalid token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/user')
        .set('Authorization', 'Token invalid.token.signature')
        .expect(401);
    });
  });

  describe('POST /api/users/logout & Token Blacklisting', () => {
    it('should logout user and blacklist the active JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/logout')
        .set('Authorization', `Token ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Successfully logged out',
      );
    });

    it('should reject subsequent requests with the blacklisted token with HTTP 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/user')
        .set('Authorization', `Token ${authToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('errors');
    });
  });
});
