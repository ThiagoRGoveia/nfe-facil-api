import { ApiProperty } from '@nestjs/swagger';

export class SingleFileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'PDF file containing the NFSe to be processed',
  })
  file: Express.Multer.File;
}
