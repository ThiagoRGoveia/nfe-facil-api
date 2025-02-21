import { Controller, Get, Param, Res } from '@nestjs/common';
import { FileStoragePort } from '../../../../../infra/aws/s3/ports/file-storage.port';
import { Public } from '@/infra/auth/public.decorator';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('downloads')
export class DownloadsController {
  private readonly contentTypes = {
    json: 'application/json',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  constructor(
    private readonly fileStorage: FileStoragePort,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get(':id')
  async downloadDocument(@Param('path') path: string, @Res() response: Response): Promise<void> {
    try {
      // Extract file extension to set correct content type
      const fileExtension = path.split('.').pop()?.toLowerCase();
      const contentType = fileExtension ? this.contentTypes[fileExtension] : 'application/octet-stream';

      const bucketName = this.configService.get<string>('DOCUMENT_BUCKET_NAME');
      const fileStream = await this.fileStorage.get(`${bucketName}/downloads/${path}`);

      // Set appropriate headers
      response.setHeader('Content-Type', contentType);
      response.setHeader('Content-Disposition', `attachment; filename=${path}`);

      // Pipe the file stream directly to the response
      fileStream.pipe(response);

      // Handle stream completion and errors
      fileStream.on('end', () => response.end());
      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        response.status(500).send('Error downloading file');
      });
    } catch (error) {
      console.error('Error getting file:', error);
      response.status(404).send('File not found');
    }
  }
}
