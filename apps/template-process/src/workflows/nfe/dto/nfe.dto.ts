import { Expose, Transform } from 'class-transformer';
import { IsString, IsEmail, IsOptional, Matches } from 'class-validator';

const EMPTY_STRING_INDICATORS = ['-', 'NÃO IDENTIFICADO NA NFS-e', 'Não', 'Nenhum', 'Não Retido', ' ', 'null', ''];

function transformToNull({ value }: { value: string }): string | null {
  if (!value || EMPTY_STRING_INDICATORS.includes(value)) {
    return null;
  }
  return value;
}

export class NfeDto {
  @IsString()
  @IsOptional()
  @Matches(/^\d{50}$/)
  @Transform(transformToNull)
  @Expose()
  chave_acesso_nfse: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  numero_nfse: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  competencia_nfse: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  data_hora_emissao_nfse: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  numeroDps: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  serieDps: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  data_hora_emissao_dps: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_prestador_servico_cnpj_cpf_nif: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_inscricao_municipal: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_telefone: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_nome_nome_empresarial: string | null;

  @IsEmail()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_email: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_endereco_logradouro: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_endereco_numero: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_endereco_bairro: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_municipio: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_cep: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_simples_nacional_data_competencia: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_regime_apuracao_tributaria_sn: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_servico_cnpj_cpf_nif: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_servico_inscricao_municipal: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_servico_telefone: string | null;

  @IsString()
  @IsOptional()
  tomadorServicoNomeNomeEmpresarial: string | null;

  @IsEmail()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_servico_email: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_servico_endereco_logradouro: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_servico_endereco_numero: string | null;

  @IsOptional()
  @IsString()
  @Transform(transformToNull)
  @Expose()
  tomador_servico_endereco_andar: string | null;

  @IsOptional()
  @IsString()
  @Transform(transformToNull)
  @Expose()
  tomador_servico_endereco_sala: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_servico_endereco_bairro: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_servico_municipio: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_servico_cep: string | null;

  @IsOptional()
  @IsString()
  @Transform(transformToNull)
  @Expose()
  intermediario_servico_identificado_nfse: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  servico_prestado_codigo_tributacao_nacional: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  servico_prestado_codigo_tributacao_municipal: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  servico_prestado_local_prestacao: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  servico_prestado_pais_prestacao: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  servico_prestado_descricao_servico: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_tributacao_issqn_operacao_tributavel: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_pais_resultado_prestacao_servico: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_municipio_incidencia_issqn: string | null;

  @IsOptional()
  @IsString()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_regime_especial_tributacao: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_tipo_imunidade: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_suspensao_exigibilidade_issqn: string | null;

  @IsOptional()
  @IsString()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_numero_processo_suspensao: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_beneficio_municipal: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_valor_servico: string | null;

  @IsOptional()
  @IsString()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_desconto_incondicionado: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_total_deducoes_reducoes: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_calculo_bm: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_bc_issqn: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_alotacao_aplicada: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_retencoes_issqn: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_issqn_apurado: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_federal_irrf: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_federal_cp: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_federal_csll: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_federal_pis: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_federal_cofins: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_federal_retencoes_pis_cofins: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_federal_total_tributos_federais: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  valor_total_nfse_valor_servico: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  valor_total_nfse_desconto_condicionado: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  valor_total_nfse_desconto_incondicionado: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  valor_total_nfse_issqn_retido: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  valor_total_nfse_irrf_cp_csll_retidos: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  valor_total_nfse_pis_cofins_retidos: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  valor_total_nfse_valor_liquido_nfse: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  totas_aproximados_tributos_federais: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  totas_aproximados_tributos_estaduais: string | null;

  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  totas_aproximados_tributos_municipais: string | null;
}
