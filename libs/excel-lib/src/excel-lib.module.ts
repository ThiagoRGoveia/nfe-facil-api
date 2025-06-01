import { Module } from '@nestjs/common';
import { ExcelLibService } from './excel-lib.service';

@Module({
  providers: [ExcelLibService],
  exports: [ExcelLibService],
})
export class ExcelLibModule {}
