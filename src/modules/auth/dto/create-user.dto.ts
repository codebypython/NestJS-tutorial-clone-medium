import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNotEmptyObject,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

export const USER_PASSWORD_MIN_LENGTH = 8;
export const USER_PASSWORD_MAX_LENGTH = 64;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 50;

export class CreateUserDataDto {
  @ApiProperty({ example: 'jake@jake.jake' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email must not be empty' })
  readonly email!: string;

  @ApiProperty({ example: 'Jacob' })
  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username must not be empty' })
  @Length(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, {
    message: 'username must be between 3 and 50 characters',
  })
  readonly username!: string;

  @ApiProperty({ example: 'jakejake' })
  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password must not be empty' })
  @Length(USER_PASSWORD_MIN_LENGTH, USER_PASSWORD_MAX_LENGTH, {
    message: 'password must be between 8 and 64 characters',
  })
  readonly password!: string;
}

export class CreateUserDto {
  @ApiProperty({ type: CreateUserDataDto })
  @ValidateNested()
  @Type(() => CreateUserDataDto)
  @IsNotEmptyObject()
  readonly user!: CreateUserDataDto;
}
