import { Test, TestingModule } from '@nestjs/testing';
import { CsvLibService } from './csv-lib.service';

describe('CsvLibService', () => {
  let service: CsvLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvLibService],
    }).compile();

    service = module.get<CsvLibService>(CsvLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
