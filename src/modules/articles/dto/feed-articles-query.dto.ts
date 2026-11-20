import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_ARTICLES_LIMIT = 20;
export const MIN_ARTICLES_LIMIT = 1;
export const MAX_ARTICLES_LIMIT = 100;
export const DEFAULT_ARTICLES_OFFSET = 0;

export class FeedArticlesQueryDto {
  @ApiPropertyOptional({
    example: DEFAULT_ARTICLES_LIMIT,
    minimum: MIN_ARTICLES_LIMIT,
    maximum: MAX_ARTICLES_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(MIN_ARTICLES_LIMIT, { message: 'limit must be at least 1' })
  @Max(MAX_ARTICLES_LIMIT, { message: 'limit must not exceed 100' })
  readonly limit?: number;

  @ApiPropertyOptional({ example: DEFAULT_ARTICLES_OFFSET, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset must be an integer' })
  @Min(0, { message: 'offset must be at least 0' })
  readonly offset?: number;
}
