import { Test, TestingModule } from '@nestjs/testing';
import { DateLibService } from './date-lib.service';

describe('DateLibService', () => {
  let service: DateLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DateLibService],
    }).compile();

    service = module.get<DateLibService>(DateLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
