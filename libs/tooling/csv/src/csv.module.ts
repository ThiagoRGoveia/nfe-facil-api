import { Module } from '@nestjs/common';
import { CsvPort } from './core/ports/csv.port';
import { Json2CsvAdapter } from './core/adapters/json-2-csv.adapter';

@Module({
  providers: [
    {
      provide: CsvPort,
      useClass: Json2CsvAdapter,
    },
  ],
  exports: [CsvPort],
})
export class CsvModule {}
