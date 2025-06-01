import { Test, TestingModule } from '@nestjs/testing';
import { ClaudeClientLibService } from './claude-client-lib.service';

describe('ClaudeClientLibService', () => {
  let service: ClaudeClientLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClaudeClientLibService],
    }).compile();

    service = module.get<ClaudeClientLibService>(ClaudeClientLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
