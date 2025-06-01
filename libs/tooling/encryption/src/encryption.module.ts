import { Module } from '@nestjs/common';
import { EncryptionPort } from './core/ports/encryption.port';
import { EncryptionAdapter } from './core/adapters/encryption.adapter';

@Module({
  providers: [
    {
      provide: EncryptionPort,
      useClass: EncryptionAdapter,
    },
  ],
  exports: [EncryptionPort],
})
export class EncryptionLibModule {}
