import { Module } from '@nestjs/common';
import { SecretsLibService } from './secrets-lib.service';

@Module({
  providers: [SecretsLibService],
  exports: [SecretsLibService],
})
export class SecretsLibModule {}
