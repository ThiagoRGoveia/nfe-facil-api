import { Global, Module } from '@nestjs/common';
import { FileStoragePort } from './core/ports/file-storage.port';
import { S3Client } from './core/clients/s3.client';

@Global()
@Module({
  providers: [
    {
      provide: FileStoragePort,
      useClass: S3Client,
    },
  ],
  exports: [FileStoragePort],
})
export class FileStorageLibModule {}
