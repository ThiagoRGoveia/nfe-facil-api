import { Test, TestingModule } from '@nestjs/testing';
import { ZipLibService } from './zip-lib.service';

describe('ZipLibService', () => {
  let service: ZipLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZipLibService],
    }).compile();

    service = module.get<ZipLibService>(ZipLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
