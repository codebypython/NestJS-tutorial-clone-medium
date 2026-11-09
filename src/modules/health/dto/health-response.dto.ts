import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    description: 'Localized greeting message',
    example: 'Welcome to Conduit RealWorld API',
  })
  readonly message!: string;

  @ApiProperty({
    description: 'System operational status',
    example: 'System operational',
  })
  readonly status!: string;

  @ApiProperty({
    description: 'Active language code resolved from request',
    example: 'en',
  })
  readonly language!: string;

  @ApiProperty({
    description: 'ISO 8601 formatted UTC timestamp',
    example: '2026-11-06T13:30:00.000Z',
  })
  readonly timestamp!: string;

  @ApiProperty({
    description: 'Current environment execution profile',
    example: 'development',
  })
  readonly environment!: string;
}
