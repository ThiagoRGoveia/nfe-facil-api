import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class OllamaClient {
  constructor(private readonly httpService: HttpService) {}

  async generate(prompt: string, model: string): Promise<string> {
    try {
      const response = await lastValueFrom(
        this.httpService.post('http://localhost:11434/api/generate', {
          model,
          prompt,
          stream: false,
        }),
      );

      return response.data.response;
    } catch (error) {
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }
}
