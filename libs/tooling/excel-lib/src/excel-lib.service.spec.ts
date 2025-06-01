import { Test, TestingModule } from '@nestjs/testing';
import { ExcelLibService } from './excel-lib.service';

describe('ExcelLibService', () => {
  let service: ExcelLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelLibService],
    }).compile();

    service = module.get<ExcelLibService>(ExcelLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
