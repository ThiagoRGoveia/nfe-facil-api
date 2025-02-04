import { Global, Module } from '@nestjs/common';
import { EncryptionAdapter } from './encryption/adapters/encryption.adapter';
import { EncryptionPort } from './encryption/ports/encryption.port';
import { UuidAdapter } from './adapters/uuid.adapter';
import { SecretAdapter } from './adapters/secret.adapter';

@Global()
@Module({
  providers: [
    UuidAdapter,
    SecretAdapter,
    {
      provide: EncryptionPort,
      useClass: EncryptionAdapter,
    },
  ],
  exports: [EncryptionPort, UuidAdapter, SecretAdapter],
})
export class ToolingModule {}
