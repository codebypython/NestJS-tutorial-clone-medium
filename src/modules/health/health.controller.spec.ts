import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { configuration } from '../../config/configuration';

describe('HealthController', () => {
  let controller: HealthController;

  const mockI18nService = {
    t: jest.fn((key: string, options?: { lang?: string }) => {
      if (key === 'common.greeting') {
        return options?.lang === 'vi'
          ? 'Chào mừng đến với Conduit RealWorld API'
          : 'Welcome to Conduit RealWorld API';
      }
      if (key === 'common.status') {
        return options?.lang === 'vi'
          ? 'Hệ thống đang hoạt động bình thường'
          : 'System operational';
      }
      return key;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
      ],
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return default english greeting payload', () => {
    const mockContext = { lang: 'en' } as unknown as I18nContext;
    const result = controller.getHello(mockContext);

    expect(result).toHaveProperty('message', 'Welcome to Conduit RealWorld API');
    expect(result).toHaveProperty('status', 'System operational');
    expect(result).toHaveProperty('language', 'en');
    expect(result).toHaveProperty('timestamp');
  });

  it('should return vietnamese localized greeting payload when requested', () => {
    const mockContext = { lang: 'vi' } as unknown as I18nContext;
    const result = controller.getHello(mockContext);

    expect(result).toHaveProperty('message', 'Chào mừng đến với Conduit RealWorld API');
    expect(result).toHaveProperty('status', 'Hệ thống đang hoạt động bình thường');
    expect(result).toHaveProperty('language', 'vi');
  });
});
