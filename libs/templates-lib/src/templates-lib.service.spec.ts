import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesLibService } from './templates-lib.service';

describe('TemplatesLibService', () => {
  let service: TemplatesLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplatesLibService],
    }).compile();

    service = module.get<TemplatesLibService>(TemplatesLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
