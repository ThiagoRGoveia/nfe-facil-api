import { Test, TestingModule } from '@nestjs/testing';
import { SecretsLibService } from './secrets-lib.service';

describe('SecretsLibService', () => {
  let service: SecretsLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecretsLibService],
    }).compile();

    service = module.get<SecretsLibService>(SecretsLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
