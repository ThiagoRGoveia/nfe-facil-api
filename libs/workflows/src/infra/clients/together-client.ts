import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { RetriableError, NonRetriableError } from '../../nfe/nfse-text.workflow';

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
  private readonly proxyUrl: string;
  private readonly proxyPort: string;
  private readonly proxyMode: boolean;
  private mockMode = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKeyValue = this.configService.get('TOGETHER_API_KEY');
    const proxyUrlValue = this.configService.get('PROXY_URL');
    const proxyPortValue = this.configService.get('PROXY_PORT');
    const proxyMode = this.configService.get('NODE_ENV') !== 'local';
    if (!apiKeyValue) {
      throw new Error('Together API key is required');
    }

    if (proxyMode && (!proxyUrlValue || !proxyPortValue)) {
      throw new Error('Proxy URL or Proxy Port is required');
    }
    this.apiKey = apiKeyValue;
    this.mockMode =
      this.configService.get('MOCK_MODE') === 'true' && this.configService.get('NODE_ENV') !== 'production';
    this.proxyUrl = proxyUrlValue;
    this.proxyPort = proxyPortValue;
    this.proxyMode = proxyMode;
  }

  async generate(prompt: string, config: LLMConfig): Promise<string> {
    try {
      if (this.mockMode) {
        return this.generateMock();
      }
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
            proxy: this.proxyMode
              ? {
                  host: this.proxyUrl,
                  port: Number(this.proxyPort),
                  protocol: 'http',
                }
              : undefined,
          },
        ),
      );
      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error processing Together API request:', error);
      if (error.response?.status === 429) {
        throw new RetriableError('Server is busy, please try again later');
      }
      throw new NonRetriableError(`Together API error: ${error.message}`);
    }
  }

  private generateMock(): string {
    return JSON.stringify({
      tomador_cep: '05416030',
      data_emissao: '2024-07-01T14:30:00',
      prestador_cep: '20040007',
      tomador_email: 'mock.company.a@fakedata.biz',
      prestador_email: 'jane.doe.services@mockmail.net',
      tomador_cnpj_cpf: '11223344000155',
      tomador_endereco: 'Av. Paulista, 1200, Conjunto 50, Cerqueira Cesar',
      tomador_telefone: '11987654321',
      tomador_municipio: 'Sao Paulo - SP',
      prestador_cnpj_cpf: '99887766000110',
      prestador_endereco: 'Rua Sete de Setembro, 111, Centro',
      prestador_telefone: '21912345678',
      prestador_municipio: 'Rio de Janeiro - RJ',
      servico_prestado_codigo: '08.02.01',
      tomador_nome_empresarial: 'Mock Solutions S.A.',
      prestador_nome_empresarial: 'Jane Doe Consulting Eireli',
      tomador_inscricao_municipal: '1234567',
      prestador_inscricao_municipal: null,
      servico_prestado_descricao_servico: 'Consultoria prestada referente ao projeto XPTO no periodo de Junho/2024',
      valor_total_nfse_valor_liquido_nfse: '1250.50',
      totais_aproximados_tributos_federais: null,
      totais_aproximados_tributos_estaduais: null,
      totais_aproximados_tributos_municipais: null,
    });
  }

  async generateWithImage(prompt: string, imageBuffer: Buffer, config: LLMConfig): Promise<string> {
    try {
      if (this.mockMode) {
        return this.generateMock();
      }
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
