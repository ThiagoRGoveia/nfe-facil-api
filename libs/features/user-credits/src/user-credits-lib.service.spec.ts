import { Test, TestingModule } from '@nestjs/testing';
import { UserCreditsLibService } from './user-credits-lib.service';

describe('UserCreditsLibService', () => {
  let service: UserCreditsLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserCreditsLibService],
    }).compile();

    service = module.get<UserCreditsLibService>(UserCreditsLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
