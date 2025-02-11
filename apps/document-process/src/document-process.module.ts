import { Module } from '@nestjs/common';
import { DocumentProcessController } from './document-process.controller';
import { DocumentProcessService } from './document-process.service';

@Module({
  imports: [],
  controllers: [DocumentProcessController],
  providers: [DocumentProcessService],
})
export class DocumentProcessModule {}
