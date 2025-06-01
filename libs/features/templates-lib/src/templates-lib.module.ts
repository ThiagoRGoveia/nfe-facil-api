import { Module } from '@nestjs/common';
import { TemplatesLibService } from './templates-lib.service';

@Module({
  providers: [TemplatesLibService],
  exports: [TemplatesLibService],
})
export class TemplatesLibModule {}
