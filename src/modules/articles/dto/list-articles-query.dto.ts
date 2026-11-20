import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { FeedArticlesQueryDto } from './feed-articles-query.dto';

export class ListArticlesQueryDto extends FeedArticlesQueryDto {
  @ApiPropertyOptional({ example: 'reactjs' })
  @IsOptional()
  @IsString({ message: 'tag must be a string' })
  readonly tag?: string;

  @ApiPropertyOptional({ example: 'jake' })
  @IsOptional()
  @IsString({ message: 'author must be a string' })
  readonly author?: string;

  @ApiPropertyOptional({ example: 'jake' })
  @IsOptional()
  @IsString({ message: 'favorited must be a string' })
  readonly favorited?: string;
}
