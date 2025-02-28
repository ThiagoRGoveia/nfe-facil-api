import { Expose, Transform } from 'class-transformer';
import { IsString, IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const EMPTY_STRING_INDICATORS = ['-', 'NÃO IDENTIFICADO NA NFS-e', 'Não', 'Nenhum', 'Não Retido', ' ', 'null', ''];

function transformToNull({ value }: { value: string }): string | null {
  if (!value || EMPTY_STRING_INDICATORS.includes(value)) {
    return null;
  }
  return value;
}

export class NfseDto {
  @ApiProperty({
    description: 'Chave de acesso da NFSe - Código de validação',
    example: '12345678901234567890123456789012345678901234567890',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{50}$/)
  @Transform(transformToNull)
  @Expose()
  chave_acesso_nfse: string | null;

  @ApiProperty({
    description: 'Número da NFSe',
    example: '123456',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  numero_nfse: string | null;

  @ApiProperty({
    description: 'Competência da NFSe (período)',
    example: '07/2023',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  competencia_nfse: string | null;

  @ApiProperty({
    description: 'Data e hora de emissão da NFSe',
    example: '2023-07-15T14:30:00',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  data_hora_emissao_nfse: string | null;

  @ApiProperty({
    description: 'Número do DPS (Documento de Prestação de Serviço)',
    example: '1234',
    required: false,
    nullable: true,
  })
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

  @ApiProperty({
    description: 'CNPJ/CPF/NIF do emitente da NFSe (prestador de serviço)',
    example: '12345678901234',
    required: false,
    nullable: true,
  })
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

  @ApiProperty({
    description: 'Nome/Nome empresarial do emitente da NFSe',
    example: 'Empresa XYZ Ltda',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  emitente_nfse_nome_nome_empresarial: string | null;

  @ApiProperty({
    description: 'Email do emitente da NFSe',
    example: 'contato@empresa.com.br',
    required: false,
    nullable: true,
  })
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

  @ApiProperty({
    description: 'CNPJ/CPF/NIF do tomador do serviço',
    example: '98765432109876',
    required: false,
    nullable: true,
  })
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

  @ApiProperty({
    description: 'Nome/Nome empresarial do tomador do serviço',
    example: 'Cliente ABC S/A',
    required: false,
    nullable: true,
  })
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

  @ApiProperty({
    description: 'Descrição do serviço prestado',
    example: 'Desenvolvimento de software sob encomenda',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  servico_prestado_descricao_servico: string | null;

  @ApiProperty({
    description: 'Valor do serviço',
    example: '1000.00',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tributacao_municipal_valor_servico: string | null;

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

  @ApiProperty({
    description: 'Valor total líquido da NFSe',
    example: '950.00',
    required: false,
    nullable: true,
  })
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
