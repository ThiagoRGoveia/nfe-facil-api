import { Module } from '@nestjs/common';
import { FileStorageLibService } from './file-storage-lib.service';

@Module({
  providers: [FileStorageLibService],
  exports: [FileStorageLibService],
})
export class FileStorageLibModule {}
