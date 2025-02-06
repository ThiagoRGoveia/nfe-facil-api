import { Global, Module } from '@nestjs/common';
import { EncryptionAdapter } from './encryption/adapters/encryption.adapter';
import { EncryptionPort } from './encryption/ports/encryption.port';
import { UuidAdapter } from './adapters/uuid.adapter';
import { SecretAdapter } from './adapters/secret.adapter';
import { ZipPort } from '@/infra/zip/zip.port';
import { ZipAdapter } from '@/infra/zip/zip.adapter';

@Global()
@Module({
  providers: [
    UuidAdapter,
    SecretAdapter,
    {
      provide: EncryptionPort,
      useClass: EncryptionAdapter,
    },
    {
      provide: ZipPort,
      useClass: ZipAdapter,
    },
  ],
  exports: [EncryptionPort, UuidAdapter, SecretAdapter, ZipPort],
})
export class ToolingModule {}
