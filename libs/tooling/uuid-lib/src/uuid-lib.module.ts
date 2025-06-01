import { Module } from '@nestjs/common';
import { UuidAdapter } from './core/uuid.adapter';

@Module({
  providers: [UuidAdapter],
  exports: [UuidAdapter],
})
export class UuidLibModule {}
