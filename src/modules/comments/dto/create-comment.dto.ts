import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNotEmptyObject, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

export const COMMENT_BODY_MAX_LENGTH = 4000;

export class CreateCommentDataDto {
  @ApiProperty({ example: 'His name was my name too.' })
  @IsString({ message: 'body must be a string' })
  @IsNotEmpty({ message: 'body must not be empty' })
  @MaxLength(COMMENT_BODY_MAX_LENGTH, {
    message: 'body must not exceed 4000 characters',
  })
  @Matches(/\S/, {
    message: 'body must not be blank or whitespace only',
  })
  readonly body!: string;
}

export class CreateCommentDto {
  @ApiProperty({ type: CreateCommentDataDto })
  @ValidateNested()
  @Type(() => CreateCommentDataDto)
  @IsNotEmptyObject({}, { message: 'comment must be a non-empty object' })
  readonly comment!: CreateCommentDataDto;
}
