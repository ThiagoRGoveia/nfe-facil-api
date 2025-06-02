import { Module } from '@nestjs/common';
import { SecretPort } from './core/secret.port';
import { SecretAdapter } from './core/secret.adapter';

@Module({
  providers: [
    {
      provide: SecretPort,
      useClass: SecretAdapter,
    },
  ],
  exports: [SecretPort],
})
export class SecretsLibModule {}
