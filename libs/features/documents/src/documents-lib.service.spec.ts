import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsLibService } from './documents-lib.service';

describe('DocumentsLibService', () => {
  let service: DocumentsLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentsLibService],
    }).compile();

    service = module.get<DocumentsLibService>(DocumentsLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
