import { Module } from '@nestjs/common';
import { UserCreditsLibService } from './user-credits-lib.service';

@Module({
  providers: [UserCreditsLibService],
  exports: [UserCreditsLibService],
})
export class UserCreditsLibModule {}
