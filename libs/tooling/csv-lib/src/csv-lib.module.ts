import { Module } from '@nestjs/common';
import { CsvLibService } from './csv-lib.service';

@Module({
  providers: [CsvLibService],
  exports: [CsvLibService],
})
export class CsvLibModule {}
