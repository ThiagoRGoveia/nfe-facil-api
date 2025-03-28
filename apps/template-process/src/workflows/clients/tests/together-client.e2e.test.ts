import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TogetherClient } from '../together-client';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

describe('TogetherClient (e2e)', () => {
  let app: TestingModule;
  let togetherClient: TogetherClient;
  let configService: ConfigService;

  beforeAll(async () => {
    // Create the testing module with real services
    app = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          isGlobal: true,
          // Use environment variables from the .env file
          envFilePath: '.env.e2e.test',
        }),
      ],
      providers: [TogetherClient],
    }).compile();

    togetherClient = app.get<TogetherClient>(TogetherClient);
    configService = app.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(togetherClient).toBeDefined();
  });

  it('should generate text from prompt', async () => {
    // Skip this test if API key is missing
    const apiKey = configService.get('TOGETHER_API_KEY');
    if (!apiKey) {
      console.warn('⚠️ Skipping test: TOGETHER_API_KEY is not set');
      return;
    }

    // Configuration for the LLM
    const config = {
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      systemMessage: 'You are a helpful assistant.',
      config: {
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        topK: 50,
        repetitionPenalty: 1.0,
      },
    };

    // Test prompt
    const prompt = 'What is the capital of France?';

    // Call the service
    const result = await togetherClient.generate(prompt, config);
    // Basic validation
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  }, 30000); // Increase timeout for API calls to 30 seconds
});
