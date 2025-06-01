import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiClientLibService } from './open-ai-client-lib.service';

describe('OpenAiClientLibService', () => {
  let service: OpenAiClientLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenAiClientLibService],
    }).compile();

    service = module.get<OpenAiClientLibService>(OpenAiClientLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
