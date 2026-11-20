import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TAG_NAME_LENGTH } from '../../tags/entities/tag.entity';
import { ARTICLE_TITLE_LENGTH } from '../entities/article.entity';

export class CreateArticleDataDto {
  @ApiProperty({ example: 'How to train your dragon' })
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title must not be empty' })
  @MaxLength(ARTICLE_TITLE_LENGTH, {
    message: 'title must not exceed 255 characters',
  })
  @Matches(/\S/, {
    message: 'title must not be blank or whitespace only',
  })
  readonly title!: string;

  @ApiProperty({ example: 'Ever wonder how?' })
  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description must not be empty' })
  @Matches(/\S/, {
    message: 'description must not be blank or whitespace only',
  })
  readonly description!: string;

  @ApiProperty({ example: 'It takes a Jacobian' })
  @IsString({ message: 'body must be a string' })
  @IsNotEmpty({ message: 'body must not be empty' })
  @Matches(/\S/, {
    message: 'body must not be blank or whitespace only',
  })
  readonly body!: string;

  @ApiPropertyOptional({ example: ['reactjs', 'angularjs'], type: [String] })
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

export class CreateArticleDto {
  @ApiProperty({ type: CreateArticleDataDto })
  @ValidateNested()
  @Type(() => CreateArticleDataDto)
  @IsNotEmptyObject({}, { message: 'article must be a non-empty object' })
  readonly article!: CreateArticleDataDto;
}
