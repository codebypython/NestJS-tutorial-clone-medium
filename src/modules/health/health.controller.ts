import { Controller, Get } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { HealthService } from './health.service';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('Health & Discovery')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('hello')
  @ApiOperation({
    summary: 'Multilingual hello world and health check verification',
    description:
      'Returns localized operational status using i18n resolvers with ISO timestamp and environment profile.',
  })
  @ApiHeader({
    name: 'x-custom-lang',
    required: false,
    description: 'Target localization code (en, vi)',
    schema: { default: 'en', enum: ['en', 'vi'] },
  })
  @ApiResponse({
    status: 200,
    description: 'System operational status successfully returned',
    type: HealthResponseDto,
  })
  getHello(@I18n() i18nContext: I18nContext): HealthResponseDto {
    return this.healthService.getHealthStatus(i18nContext);
  }

  @Get()
  @ApiOperation({
    summary: 'API root discovery index',
    description: 'Fallback endpoint returning base service metadata.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service descriptor payload',
    type: HealthResponseDto,
  })
  getRoot(@I18n() i18nContext: I18nContext): HealthResponseDto {
    return this.healthService.getHealthStatus(i18nContext);
  }
}
