import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionLibService } from './encryption-lib.service';

describe('EncryptionLibService', () => {
  let service: EncryptionLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionLibService],
    }).compile();

    service = module.get<EncryptionLibService>(EncryptionLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
