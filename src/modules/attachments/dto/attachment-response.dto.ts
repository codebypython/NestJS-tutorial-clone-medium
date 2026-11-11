import { ApiProperty } from '@nestjs/swagger';

export class AttachmentResponseDataDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: '/public/uploads/avatars/a1b2c3d4.png' })
  url!: string;

  @ApiProperty({ example: 'a1b2c3d4.png' })
  fileName!: string;
}

export class AttachmentResponseDto {
  @ApiProperty({ type: AttachmentResponseDataDto })
  attachment!: AttachmentResponseDataDto;
}
