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
  private mockMode = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKeyValue = this.configService.get('TOGETHER_API_KEY');
    if (!apiKeyValue) {
      throw new Error('Together API key is required');
    }
    this.apiKey = apiKeyValue;
    this.mockMode = this.configService.get('MOCK_MODE') === 'true';
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
          },
        ),
      );
      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Together API error: ${error.message}`);
    }
  }

  private generateMock(): string {
    return JSON.stringify({
      tomador_cep: '01326010',
      data_emissao: '2024-07-01T13:58:18',
      prestador_cep: '24813548',
      tomador_email: 'liviatoledo@pontue.com.br',
      prestador_email: 'ccamilecabral@gmail.com',
      tomador_cnpj_cpf: '28776766000181',
      tomador_endereco: 'Rui Barbosa, 156, Andar 1 Sala 6, Belavista',
      tomador_telefone: null,
      tomador_municipio: 'Sao Paulo - SP',
      prestador_cnpj_cpf: '55337202000115',
      prestador_endereco: 'Maria Aparecida Da Silva, 70, Joaquim De Oliveira',
      prestador_telefone: '2199264014',
      prestador_municipio: 'Itaborai - RJ',
      servico_prestado_codigo: '08.02.01',
      tomador_nome_empresarial: 'Cl2m Projetos E Me Educacao S.A.',
      prestador_nome_empresarial: '55.337.202-Camile Vitoria Da Silva Cabral',
      tomador_inscricao_municipal: null,
      prestador_inscricao_municipal: null,
      servico_prestado_descricao_servico: 'Prestacao de servico como correta ordenada no mes de junho de 2024',
      valor_total_nfse_valor_liquido_nfse: '756.00',
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
