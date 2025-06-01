import { Expose, Transform } from 'class-transformer';
import { IsString, IsEmail, IsOptional } from 'class-validator';
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
    description: 'Data e hora de emissão da NFSe',
    example: '2023-07-15T14:30:00',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  data_emissao: string | null;

  @ApiProperty({
    description:
      'CNPJ/CPF/NIF do prestador emitente da NFSe (prestador de serviço). CNPJ: 14 dígitos (XX.XXX.XXX/XXXX-XX), CPF: 11 dígitos (XXX.XXX.XXX-XX)',
    example: '12345678901234',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  prestador_cnpj_cpf: string | null;

  @ApiProperty({
    description: 'Inscrição Municipal do prestador emitente da NFSe',
    example: '123456789',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  prestador_inscricao_municipal: string | null;

  @ApiProperty({
    description: 'Telefone do prestador emitente da NFSe',
    example: '11912345678',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  prestador_telefone: string | null;

  @ApiProperty({
    description: 'Nome/Nome empresarial do prestador emitente da NFSe',
    example: 'Empresa XYZ Ltda',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  prestador_nome_empresarial: string | null;

  @ApiProperty({
    description: 'Email do prestador emitente da NFSe',
    example: 'contato@empresa.com.br',
    required: false,
    nullable: true,
  })
  @IsEmail()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  prestador_email: string | null;

  @ApiProperty({
    description: 'Endereço completo do prestador emitente da NFSe',
    example: 'Rua Exemplo, 123, Sala 45',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  prestador_endereco: string | null;

  @ApiProperty({
    description: 'Município do prestador emitente da NFSe',
    example: 'São Paulo',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  prestador_municipio: string | null;

  @ApiProperty({
    description: 'CEP do prestador emitente da NFSe no formato XXXXX-XXX',
    example: '01234-567',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  prestador_cep: string | null;

  @ApiProperty({
    description:
      'CNPJ/CPF/NIF do tomador do serviço. CNPJ: 14 dígitos (XX.XXX.XXX/XXXX-XX), CPF: 11 dígitos (XXX.XXX.XXX-XX)',
    example: '98765432109876',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_cnpj_cpf: string | null;

  @ApiProperty({
    description: 'Inscrição Municipal do tomador do serviço',
    example: '987654321',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_inscricao_municipal: string | null;

  @ApiProperty({
    description: 'Telefone do tomador do serviço',
    example: '11987654321',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_telefone: string | null;

  @ApiProperty({
    description: 'Nome/Nome empresarial do tomador do serviço',
    example: 'Cliente ABC S/A',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_nome_empresarial: string | null;

  @ApiProperty({
    description: 'Email do tomador do serviço',
    example: 'financeiro@cliente.com.br',
    required: false,
    nullable: true,
  })
  @IsEmail()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_email: string | null;

  @ApiProperty({
    description: 'Endereço completo do tomador do serviço',
    example: 'Avenida Cliente, 456, Andar 10',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_endereco: string | null;

  @ApiProperty({
    description: 'Município do tomador do serviço',
    example: 'Rio de Janeiro',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_municipio: string | null;

  @ApiProperty({
    description: 'CEP do tomador do serviço no formato XXXXX-XXX',
    example: '20000-000',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  tomador_cep: string | null;

  @ApiProperty({
    description: 'Código do serviço prestado conforme Lista de Serviços da LC 116/2003',
    example: '01.01',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  servico_prestado_codigo: string | null;

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

  @ApiProperty({
    description: 'Valor aproximado dos tributos federais incidentes sobre o serviço',
    example: '142.50',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  totais_aproximados_tributos_federais: string | null;

  @ApiProperty({
    description: 'Valor aproximado dos tributos estaduais incidentes sobre o serviço',
    example: '47.50',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  totais_aproximados_tributos_estaduais: string | null;

  @ApiProperty({
    description: 'Valor aproximado dos tributos municipais incidentes sobre o serviço (ex: ISS)',
    example: '95.00',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Transform(transformToNull)
  @Expose()
  totais_aproximados_tributos_municipais: string | null;
}
