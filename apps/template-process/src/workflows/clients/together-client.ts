import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

type LLMConfig = {
  model: string;
  systemMessage: string;
  config: {
    maxTokens: number;
    temperature: number;
    topP: number;
    topK: number;
    repetitionPenalty: number;
    seed?: number;
  };
};

@Injectable()
export class TogetherClient {
  private readonly apiUrl = 'https://api.together.xyz/v1/chat/completions';
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKeyValue = this.configService.get('TOGETHER_API_KEY');
    if (!apiKeyValue) {
      throw new Error('Together API key is required');
    }
    this.apiKey = apiKeyValue;
  }

  async generate(prompt: string, config: LLMConfig): Promise<string> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          this.apiUrl,
          {
            model: config.model,
            messages: [
              {
                role: 'system',
                content: config.systemMessage,
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: config.config.maxTokens,
            temperature: config.config.temperature,
            top_p: config.config.topP,
            top_k: config.config.topK,
            repetition_penalty: config.config.repetitionPenalty,
            seed: config.config.seed,
            stop: ['<|im_end|>'],
            stream: false,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Together API error: ${error.message}`);
    }
  }

  async generateWithImage(prompt: string, imageBuffer: Buffer, config: LLMConfig): Promise<string> {
    try {
      const base64Image = imageBuffer.toString('base64');
      const response = await lastValueFrom(
        this.httpService.post(
          this.apiUrl,
          {
            model: config.model,
            messages: [
              {
                role: 'system',
                content: config.systemMessage,
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Image}`,
                    },
                  },
                  {
                    type: 'text',
                    text: prompt,
                  },
                ],
              },
            ],
            max_tokens: config.config.maxTokens,
            temperature: config.config.temperature,
            top_p: config.config.topP,
            top_k: config.config.topK,
            repetition_penalty: config.config.repetitionPenalty,
            seed: config.config.seed,
            stop: ['<|im_end|>'],
            stream: false,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Together API error: ${error.message}`);
    }
  }
}
