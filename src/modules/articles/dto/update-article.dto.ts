import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { TAG_NAME_LENGTH } from '../../tags/entities/tag.entity';
import { ARTICLE_TITLE_LENGTH } from '../entities/article.entity';

export class UpdateArticleDataDto {
  @ApiPropertyOptional({ example: 'Did you train your dragon?' })
  @IsOptional()
  @IsString({ message: 'title must be a string' })
  @MaxLength(ARTICLE_TITLE_LENGTH, {
    message: 'title must not exceed 255 characters',
  })
  @Matches(/\S/, {
    message: 'title must not be blank or whitespace only',
  })
  readonly title?: string;

  @ApiPropertyOptional({ example: 'Ever wonder how?' })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @Matches(/\S/, {
    message: 'description must not be blank or whitespace only',
  })
  readonly description?: string;

  @ApiPropertyOptional({ example: 'It takes a Jacobian' })
  @IsOptional()
  @IsString({ message: 'body must be a string' })
  @Matches(/\S/, {
    message: 'body must not be blank or whitespace only',
  })
  readonly body?: string;

  @ApiPropertyOptional({ example: ['dragons', 'training'], type: [String] })
  @IsOptional()
  @IsArray({ message: 'tagList must be an array of strings' })
  @IsString({ each: true, message: 'each tag must be a string' })
  @MaxLength(TAG_NAME_LENGTH, {
    each: true,
    message: 'each tag must not exceed 100 characters',
  })
  @Matches(/\S/, {
    each: true,
    message: 'each tag must not be blank or whitespace only',
  })
  readonly tagList?: string[];
}

export class UpdateArticleDto {
  @ApiPropertyOptional({ type: UpdateArticleDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateArticleDataDto)
  readonly article?: UpdateArticleDataDto;
}
