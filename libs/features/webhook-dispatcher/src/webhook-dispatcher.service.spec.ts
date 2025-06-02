import { Test, TestingModule } from '@nestjs/testing';
import { WebhookDispatcherService } from './webhook-dispatcher.service';

describe('WebhookDispatcherService', () => {
  let service: WebhookDispatcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookDispatcherService],
    }).compile();

    service = module.get<WebhookDispatcherService>(WebhookDispatcherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
