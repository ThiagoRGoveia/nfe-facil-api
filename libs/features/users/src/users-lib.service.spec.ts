import { Test, TestingModule } from '@nestjs/testing';
import { UsersLibService } from './users-lib.service';

describe('UsersLibService', () => {
  let service: UsersLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersLibService],
    }).compile();

    service = module.get<UsersLibService>(UsersLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
