import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
} from '../../auth/dto/create-user.dto';
import {
  USER_EMAIL_LENGTH,
  USER_IMAGE_URL_LENGTH,
} from '../entities/user.entity';

export class UpdateUserDataDto {
  @ApiPropertyOptional({ example: 'jake@jake.jake' })
  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(USER_EMAIL_LENGTH, {
    message: 'email must not exceed 255 characters',
  })
  email?: string;

  @ApiPropertyOptional({ example: 'Jacob' })
  @IsOptional()
  @IsString({ message: 'username must be a string' })
  @Length(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, {
    message: 'username must be between 3 and 50 characters',
  })
  username?: string;

  @ApiPropertyOptional({ example: 'newpassword123' })
  @IsOptional()
  @IsString({ message: 'password must be a string' })
  @Length(USER_PASSWORD_MIN_LENGTH, USER_PASSWORD_MAX_LENGTH, {
    message: 'password must be between 8 and 64 characters',
  })
  password?: string;

  @ApiPropertyOptional({ example: 'I like to skateboard', nullable: true })
  @IsOptional()
  @IsString({ message: 'bio must be a string' })
  bio?: string | null;

  @ApiPropertyOptional({
    example: 'https://i.stack.imgur.com/xHWG8.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'image must be a string' })
  @MaxLength(USER_IMAGE_URL_LENGTH, {
    message: 'image url must not exceed 500 characters',
  })
  image?: string | null;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ type: UpdateUserDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserDataDto)
  user?: UpdateUserDataDto;
}

