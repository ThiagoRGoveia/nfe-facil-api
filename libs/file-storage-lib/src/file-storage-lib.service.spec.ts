import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageLibService } from './file-storage-lib.service';

describe('FileStorageLibService', () => {
  let service: FileStorageLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileStorageLibService],
    }).compile();

    service = module.get<FileStorageLibService>(FileStorageLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
