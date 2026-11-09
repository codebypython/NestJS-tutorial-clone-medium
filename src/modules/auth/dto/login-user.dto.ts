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
import {
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
} from './create-user.dto';

export class LoginUserDataDto {
  @ApiProperty({ example: 'jake@jake.jake' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email must not be empty' })
  readonly email!: string;

  @ApiProperty({ example: 'jakejake' })
  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password must not be empty' })
  @Length(USER_PASSWORD_MIN_LENGTH, USER_PASSWORD_MAX_LENGTH, {
    message: 'password must be between 8 and 64 characters',
  })
  readonly password!: string;
}

export class LoginUserDto {
  @ApiProperty({ type: LoginUserDataDto })
  @ValidateNested()
  @Type(() => LoginUserDataDto)
  @IsNotEmptyObject()
  readonly user!: LoginUserDataDto;
}
