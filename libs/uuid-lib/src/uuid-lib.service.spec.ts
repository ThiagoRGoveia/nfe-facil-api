import { Test, TestingModule } from '@nestjs/testing';
import { UuidLibService } from './uuid-lib.service';

describe('UuidLibService', () => {
  let service: UuidLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UuidLibService],
    }).compile();

    service = module.get<UuidLibService>(UuidLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
