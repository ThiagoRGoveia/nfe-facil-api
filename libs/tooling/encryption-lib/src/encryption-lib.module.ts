import { Module } from '@nestjs/common';
import { EncryptionLibService } from './encryption-lib.service';

@Module({
  providers: [EncryptionLibService],
  exports: [EncryptionLibService],
})
export class EncryptionLibModule {}
