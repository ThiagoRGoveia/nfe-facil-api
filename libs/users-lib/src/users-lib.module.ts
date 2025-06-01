import { Module } from '@nestjs/common';
import { UsersLibService } from './users-lib.service';

@Module({
  providers: [UsersLibService],
  exports: [UsersLibService],
})
export class UsersLibModule {}
