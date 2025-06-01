import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksLibService } from './webhooks-lib.service';

describe('WebhooksLibService', () => {
  let service: WebhooksLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhooksLibService],
    }).compile();

    service = module.get<WebhooksLibService>(WebhooksLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
