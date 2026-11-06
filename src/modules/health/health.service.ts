import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  constructor(
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {}

  getHealthStatus(i18nContext?: I18nContext): HealthResponseDto {
    const lang = i18nContext?.lang ?? this.configService.get<string>('fallbackLanguage', 'en');
    const message = this.i18n.t('common.greeting', { lang });
    const status = this.i18n.t('common.status', { lang });
    const environment = this.configService.get<string>('environment', 'development');

    return {
      message: typeof message === 'string' ? message : 'Welcome to Conduit RealWorld API',
      status: typeof status === 'string' ? status : 'System operational',
      language: lang,
      timestamp: new Date().toISOString(),
      environment,
    };
  }
}
