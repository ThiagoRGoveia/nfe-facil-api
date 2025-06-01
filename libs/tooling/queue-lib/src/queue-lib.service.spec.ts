import { Test, TestingModule } from '@nestjs/testing';
import { QueueLibService } from './queue-lib.service';

describe('QueueLibService', () => {
  let service: QueueLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueLibService],
    }).compile();

    service = module.get<QueueLibService>(QueueLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
