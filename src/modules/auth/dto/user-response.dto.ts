import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDataDto {
  @ApiProperty({ example: 'jake@jake.jake' })
  email!: string;

  @ApiProperty({ example: 'jwt.token.here' })
  token!: string;

  @ApiProperty({ example: 'Jacob' })
  username!: string;

  @ApiProperty({ example: 'I like to skateboard', nullable: true })
  bio!: string | null;

  @ApiProperty({ example: 'https://i.stack.imgur.com/xHWG8.jpg', nullable: true })
  image!: string | null;
}

export class UserResponseDto {
  @ApiProperty({ type: UserResponseDataDto })
  user!: UserResponseDataDto;
}
