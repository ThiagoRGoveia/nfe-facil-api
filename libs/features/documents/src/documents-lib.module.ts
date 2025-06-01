import { Module } from '@nestjs/common';
import { DocumentsLibService } from './documents-lib.service';

@Module({
  providers: [DocumentsLibService],
  exports: [DocumentsLibService],
})
export class DocumentsLibModule {}
