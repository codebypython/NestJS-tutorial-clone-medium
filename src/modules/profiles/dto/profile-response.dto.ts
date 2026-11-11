import { ApiProperty } from '@nestjs/swagger';

export class ProfileDataDto {
  @ApiProperty({ example: 'jake' })
  username!: string;

  @ApiProperty({ example: 'I like to skateboard', nullable: true })
  bio!: string | null;

  @ApiProperty({
    example: 'https://i.stack.imgur.com/xHWG8.jpg',
    nullable: true,
  })
  image!: string | null;

  @ApiProperty({ example: false })
  following!: boolean;
}

export class ProfileResponseDto {
  @ApiProperty({ type: ProfileDataDto })
  profile!: ProfileDataDto;
}
