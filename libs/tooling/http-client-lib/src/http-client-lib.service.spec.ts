import { Test, TestingModule } from '@nestjs/testing';
import { HttpClientLibService } from './http-client-lib.service';

describe('HttpClientLibService', () => {
  let service: HttpClientLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpClientLibService],
    }).compile();

    service = module.get<HttpClientLibService>(HttpClientLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
