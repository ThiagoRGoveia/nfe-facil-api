import { Module } from '@nestjs/common';
import { ZipAdapter } from './core/adapters/zip.adapter';
import { ZipPort } from './core/zip.port';

@Module({
  providers: [
    {
      provide: ZipPort,
      useClass: ZipAdapter,
    },
  ],
  exports: [ZipPort],
})
export class ZipLibModule {}
