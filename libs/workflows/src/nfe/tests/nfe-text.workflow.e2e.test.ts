import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import fs from 'fs';
import path from 'path';

import { NfeTextWorkflow } from '../nfse-text.workflow';
import { PdfPort } from '@lib/workflows/infra/pdf/ports/pdf.port';
import { DocumentProcessResult } from 'apps/process-document-job/src/core/domain/value-objects/document-process-result';
import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { PdfAdapter } from '@lib/workflows/infra/pdf/adapters/pdf.adapter';
import { useDbTemplate } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { BaseE2eTestModule } from '@doc/core/testing/base-e2e-test.module';

const file = fs.readFileSync(path.join(__dirname, 'test-nfe.pdf'));
jest.setTimeout(100000);
describe('NfeTextWorkflow (e2e)', () => {
  let app: TestingModule;
  let workflow: NfeTextWorkflow;
  let em: EntityManager;
  let template: Template;

  const prompt = `
  """
extraia os dados da nota fiscal eletrônica a seguir em formato json como no exemplo a seguir, não escreva mais nada além do json, não use nenhum outro formato além do descrito em <exemplo>

<exemplo>
{
"chave_acesso_nfse": "Chave de acesso completa da NFS-e",
"numero_nfse": "Número da NFS-e",
"competencia_nfse": "Competência fiscal da NFS-e",
"data_hora_emissao_nfse": "Data e hora da emissão da NFS-e",
"numero_dps": "Número da Declaração de Prestação de Serviços (DPS)",
"serie_dps": "Série da DPS",
"data_hora_emissao_dps": "Data e hora da emissão da DPS",
"emitente_nfse_prestador_servico_cnpj_cpf_nif": "CNPJ do emitente/prestador de serviços",
"emitente_nfse_inscricao_municipal": "Inscrição municipal do emitente",
"emitente_nfse_telefone": "Telefone do emitente",
"emitente_nfse_nome_nome_empresarial": "Nome ou razão social do emitente",
"emitente_nfse_email": "Email do emitente",
"emitente_nfse_endereco_logradouro": "Logradouro do endereço do emitente",
"emitente_nfse_endereco_numero": "Número do endereço do emitente",
"emitente_nfse_endereco_bairro": "Bairro do endereço do emitente",
"emitente_nfse_municipio": "Município e estado do emitente",
"emitente_nfse_cep": "CEP do endereço do emitente",
"emitente_nfse_simples_nacional_data_competencia": "Regime tributário do emitente",
"emitente_nfse_regime_apuracao_tributaria_sn": "Regime de apuração tributária",
"tomador_servico_cnpj_cpf_nif": "CNPJ do tomador do serviço",
"tomador_servico_inscricao_municipal": "Inscrição municipal do tomador",
"tomador_servico_telefone": "Telefone do tomador",
"tomador_servico_nome_nome_empresarial": "Nome ou razão social do tomador",
"tomador_servico_email": "Email do tomador",
"tomador_servico_endereco_logradouro": "Logradouro do endereço do tomador",
"tomador_servico_endereco_numero": "Número do endereço do tomador",
"tomador_servico_endereco_andar": "Andar do endereço do tomador",
"tomador_servico_endereco_sala": "Sala do endereço do tomador",
"tomador_servico_endereco_bairro": "Bairro do endereço do tomador",
"tomador_servico_municipio": "Município e estado do tomador",
"tomador_servico_cep": "CEP do endereço do tomador",
"servico_prestado_codigo_tributacao_nacional": "Código de tributação nacional do serviço",
"servico_prestado_codigo_tributacao_municipal": "Código de tributação municipal",
"servico_prestado_local_prestacao": "Local da prestação do serviço",
"servico_prestado_pais_prestacao": "País da prestação do serviço",
"servico_prestado_descricao_servico": "Descrição do serviço prestado",
"tributacao_municipal_tributacao_issqn_operacao_tributavel": "Indica se a operação é tributável pelo ISSQN",
"tributacao_municipal_pais_resultado_prestacao_servico": "País de resultado da prestação",
"tributacao_municipal_municipio_incidencia_issqn": "Município de incidência do ISSQN",
"tributacao_municipal_regime_especial_tributacao": "Regime especial de tributação, não aplicável",
"tributacao_municipal_tipo_imunidade": "Tipo de imunidade",
"tributacao_municipal_suspensao_exigibilidade_issqn": "Indica se há suspensão da exigibilidade do ISSQN",
"tributacao_municipal_numero_processo_suspensao": "Número do processo de suspensão",
"tributacao_municipal_beneficio_municipal": "Benefício municipal",
"tributacao_municipal_valor_servico": "Valor do serviço prestado",
"tributacao_municipal_desconto_incondicionado": "Desconto incondicionado, não aplicado",
"tributacao_municipal_total_deducoes_reducoes": "Total de deduções/reduções",
"tributacao_municipal_calculo_bm": "Cálculo do benefício municipal",
"tributacao_municipal_bc_issqn": "Base de cálculo do ISSQN",
"tributacao_municipal_alotacao_aplicada": "Alíquota aplicada",
"tributacao_municipal_retencoes_issqn": "Indica se houve retenção do ISSQN",
"tributacao_municipal_issqn_apurado": "Valor do ISSQN apurado",
"tributacao_federal_irrf": "Valor do IRRF",
"tributacao_federal_cp": "Valor do CP",
"tributacao_federal_csll": "Valor do CSLL",
"tributacao_federal_pis": "Valor do PIS",
"tributacao_federal_cofins": "Valor do COFINS",
"tributacao_federal_retencoes_pis_cofins": "Valor das retenções de PIS e COFINS",
"tributacao_federal_total_tributos_federais": "Valor total dos tributos federais",
"valor_total_nfse_valor_servico": "Valor do serviço prestado",
"valor_total_nfse_desconto_condicionado": "Valor do desconto condicionado",
"valor_total_nfse_desconto_incondicionado": "Valor do desconto incondicionado",
"valor_total_nfse_issqn_retido": "Valor do ISSQN retido",
"valor_total_nfse_irrf_cp_csll_retidos": "Valor das retenções de IRRF, CP e CSLL",
"valor_total_nfse_pis_cofins_retidos": "Valor das retenções de PIS e COFINS",
"valor_total_nfse_valor_liquido_nfse": "Valor líquido da NFS-e",
"totas_aproximados_tributos_federais": "Valor aproximado dos tributos federais",
"totas_aproximados_tributos_estaduais": "Valor aproximado dos tributos estaduais",
"totas_aproximados_tributos_municipais": "Valor aproximado dos tributos municipais"
}
</exemplo>

<nota_fiscal>
{{nfeText}}
</nota_fiscal>
"""
`;

  const expected = {
    chave_acesso_nfse: '31433022255220287000157000000000000224070079681431',
    numero_nfse: '2',
    competencia_nfse: '01/07/2024',
    data_hora_emissao_nfse: '01/07/2024 11:51:28',
    numeroDps: null,
    serieDps: null,
    data_hora_emissao_dps: '01/07/2024 11:51:28',
    emitente_nfse_prestador_servico_cnpj_cpf_nif: '55.220.287/0001-57',
    emitente_nfse_inscricao_municipal: null,
    emitente_nfse_telefone: '(38)8403-6940',
    emitente_nfse_nome_nome_empresarial: '55.220.287 ANNA FLAVIA FREITAS GONCALVES',
    emitente_nfse_email: 'PROF.ANNAFLAVIAG@GMAIL.COM',
    emitente_nfse_endereco_logradouro: 'CECILIA MEIRELES',
    emitente_nfse_endereco_numero: '159',
    emitente_nfse_endereco_bairro: 'PLANALTO',
    emitente_nfse_municipio: 'Montes Claros - MG',
    emitente_nfse_cep: '39404-025',
    emitente_nfse_simples_nacional_data_competencia: 'Optante - Microempreendedor Individual (MEI)',
    emitente_nfse_regime_apuracao_tributaria_sn: null,
    tomador_servico_cnpj_cpf_nif: '28.776.766/0001-81',
    tomador_servico_inscricao_municipal: null,
    tomador_servico_telefone: null,
    tomador_servico_email: 'PROFESSORACRISMIURA@GMAIL.COM',
    tomador_servico_endereco_logradouro: 'RUI BARBOSA',
    tomador_servico_endereco_numero: '156',
    tomador_servico_endereco_andar: '1',
    tomador_servico_endereco_sala: '6',
    tomador_servico_endereco_bairro: 'BELA VISTA',
    tomador_servico_municipio: 'São Paulo - SP',
    tomador_servico_cep: '01326-010',
    intermediario_servico_identificado_nfse: null,
    servico_prestado_codigo_tributacao_nacional: '08.01.01',
    servico_prestado_codigo_tributacao_municipal: null,
    servico_prestado_local_prestacao: 'Montes Claros - MG',
    servico_prestado_pais_prestacao: null,
    servico_prestado_descricao_servico:
      'Concerne à atividade de correção de redações e outros textos escolares de forma on-line.',
    tributacao_municipal_tributacao_issqn_operacao_tributavel: 'Sim',
    tributacao_municipal_pais_resultado_prestacao_servico: null,
    tributacao_municipal_municipio_incidencia_issqn: 'Montes Claros - MG',
    tributacao_municipal_regime_especial_tributacao: null,
    tributacao_municipal_tipo_imunidade: null,
    tributacao_municipal_suspensao_exigibilidade_issqn: null,
    tributacao_municipal_numero_processo_suspensao: null,
    tributacao_municipal_beneficio_municipal: null,
    tributacao_municipal_valor_servico: 'R$ 740,25',
    tributacao_municipal_desconto_incondicionado: null,
    tributacao_municipal_total_deducoes_reducoes: null,
    tributacao_municipal_calculo_bm: null,
    tributacao_municipal_bc_issqn: null,
    tributacao_municipal_alotacao_aplicada: null,
    tributacao_municipal_retencoes_issqn: null,
    tributacao_municipal_issqn_apurado: null,
    tributacao_federal_irrf: null,
    tributacao_federal_cp: null,
    tributacao_federal_csll: null,
    tributacao_federal_pis: null,
    tributacao_federal_cofins: null,
    tributacao_federal_retencoes_pis_cofins: null,
    tributacao_federal_total_tributos_federais: null,
    valor_total_nfse_valor_servico: 'R$ 740,25',
    valor_total_nfse_desconto_condicionado: 'R$ 0,00',
    valor_total_nfse_desconto_incondicionado: 'R$ 0,00',
    valor_total_nfse_issqn_retido: null,
    valor_total_nfse_irrf_cp_csll_retidos: 'R$ 0,00',
    valor_total_nfse_pis_cofins_retidos: null,
    valor_total_nfse_valor_liquido_nfse: 'R$ 740,25',
    totas_aproximados_tributos_federais: null,
    totas_aproximados_tributos_estaduais: null,
    totas_aproximados_tributos_municipais: null,
  };

  beforeAll(async () => {
    // Create the testing module with real services
    app = await Test.createTestingModule({
      imports: [BaseE2eTestModule],
      providers: [
        NfeTextWorkflow,
        {
          provide: PdfPort,
          useClass: PdfAdapter,
        },
      ],
    }).compile();

    workflow = app.get<NfeTextWorkflow>(NfeTextWorkflow);
    em = app.get<EntityManager>(EntityManager);

    await app.init();

    // Create a sample template for testing
    template = await useDbTemplate(
      {
        metadata: {
          prompt,
          modelConfigs: [
            {
              model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
              systemMessage:
                'Você fala portugues brasileiro e sabe tudo sobre a Nota Fiscal Eletrônica NF-e.\n\nextraia os dados da nota fiscal eletrônica a seguir em formato json como no exemplo a seguir, não escreva mais nada além do json, não use nenhum outro formato além do descrito em <exemplo>',
              config: {
                maxTokens: 2048,
                temperature: 0.15,
                topP: 0.3,
                topK: 50,
                repetitionPenalty: 1.2,
                seed: 42,
              },
            },
          ],
        },
      },
      em,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(workflow).toBeDefined();
  });

  it('should process an NFE PDF and extract information', async () => {
    const result = await workflow.execute(file, template);

    // Verify the result is successful
    expect(result).toBeInstanceOf(DocumentProcessResult);
    expect(result.isSuccess()).toBe(true);

    // Check that the extracted data has the expected structure
    const data = result.payload;
    expect(data).toBeDefined();
    expect(data).toEqual(expected);
  });
});
