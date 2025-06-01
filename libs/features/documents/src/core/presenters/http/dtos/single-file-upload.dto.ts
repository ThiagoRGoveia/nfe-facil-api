import { ApiProperty } from '@nestjs/swagger';

export class SingleFileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Arquivo PDF contendo a NFSe a ser processada',
  })
  file: Express.Multer.File;
}
