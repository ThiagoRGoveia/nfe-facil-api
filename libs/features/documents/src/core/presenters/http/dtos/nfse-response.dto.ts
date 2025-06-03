import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class NfseResponseDto {
  @ApiProperty({ description: 'Data e hora de emissão da NFSe', example: '2023-07-15T14:30:00' })
  @Expose({ name: 'data_emissao' })
  dataEmissao: string | null;

  @ApiProperty({
    description: 'CNPJ/CPF/NIF do prestador emitente da NFSe',
    example: '12345678901234',
  })
  @Expose({ name: 'prestador_cnpj_cpf' })
  prestadorCnpjCpf: string | null;

  @ApiProperty({ description: 'Inscrição Municipal do prestador emitente da NFSe', example: '123456789' })
  @Expose({ name: 'prestador_inscricao_municipal' })
  prestadorInscricaoMunicipal: string | null;

  @ApiProperty({ description: 'Telefone do prestador emitente da NFSe', example: '11912345678' })
  @Expose({ name: 'prestador_telefone' })
  prestadorTelefone: string | null;

  @ApiProperty({ description: 'Nome/Nome empresarial do prestador emitente da NFSe', example: 'Empresa XYZ Ltda' })
  @Expose({ name: 'prestador_nome_empresarial' })
  prestadorNomeEmpresarial: string | null;

  @ApiProperty({ description: 'Email do prestador emitente da NFSe', example: 'contato@empresa.com.br' })
  @Expose({ name: 'prestador_email' })
  prestadorEmail: string | null;

  @ApiProperty({ description: 'Endereço completo do prestador emitente da NFSe', example: 'Rua Exemplo, 123, Sala 45' })
  @Expose({ name: 'prestador_endereco' })
  prestadorEndereco: string | null;

  @ApiProperty({ description: 'Município do prestador emitente da NFSe', example: 'São Paulo' })
  @Expose({ name: 'prestador_municipio' })
  prestadorMunicipio: string | null;

  @ApiProperty({ description: 'CEP do prestador emitente da NFSe', example: '01234-567' })
  @Expose({ name: 'prestador_cep' })
  prestadorCep: string | null;

  @ApiProperty({
    description: 'CNPJ/CPF/NIF do tomador do serviço',
    example: '98765432109876',
  })
  @Expose({ name: 'tomador_cnpj_cpf' })
  tomadorCnpjCpf: string | null;

  @ApiProperty({ description: 'Inscrição Municipal do tomador do serviço', example: '987654321' })
  @Expose({ name: 'tomador_inscricao_municipal' })
  tomadorInscricaoMunicipal: string | null;

  @ApiProperty({ description: 'Telefone do tomador do serviço', example: '11987654321' })
  @Expose({ name: 'tomador_telefone' })
  tomadorTelefone: string | null;

  @ApiProperty({ description: 'Nome/Nome empresarial do tomador do serviço', example: 'Cliente ABC S/A' })
  @Expose({ name: 'tomador_nome_empresarial' })
  tomadorNomeEmpresarial: string | null;

  @ApiProperty({ description: 'Email do tomador do serviço', example: 'financeiro@cliente.com.br' })
  @Expose({ name: 'tomador_email' })
  tomadorEmail: string | null;

  @ApiProperty({ description: 'Endereço completo do tomador do serviço', example: 'Avenida Cliente, 456, Andar 10' })
  @Expose({ name: 'tomador_endereco' })
  tomadorEndereco: string | null;

  @ApiProperty({ description: 'Município do tomador do serviço', example: 'Rio de Janeiro' })
  @Expose({ name: 'tomador_municipio' })
  tomadorMunicipio: string | null;

  @ApiProperty({ description: 'CEP do tomador do serviço', example: '20000-000' })
  @Expose({ name: 'tomador_cep' })
  tomadorCep: string | null;

  @ApiProperty({ description: 'Código do serviço prestado', example: '01.01' })
  @Expose({ name: 'servico_prestado_codigo' })
  servicoPrestadoCodigo: string | null;

  @ApiProperty({ description: 'Descrição do serviço prestado', example: 'Desenvolvimento de software sob encomenda' })
  @Expose({ name: 'servico_prestado_descricao_servico' })
  servicoPrestadoDescricaoServico: string | null;

  @ApiProperty({ description: 'Valor total líquido da NFSe', example: '950.00' })
  @Expose({ name: 'valor_total_nfse_valor_liquido_nfse' })
  valorTotalNfseValorLiquidoNfse: string | null;

  @ApiProperty({ description: 'Valor aproximado dos tributos federais', example: '142.50' })
  @Expose({ name: 'totais_aproximados_tributos_federais' })
  totaisAproximadosTributosFederais: string | null;

  @ApiProperty({ description: 'Valor aproximado dos tributos estaduais', example: '47.50' })
  @Expose({ name: 'totais_aproximados_tributos_estaduais' })
  totaisAproximadosTributosEstaduais: string | null;

  @ApiProperty({ description: 'Valor aproximado dos tributos municipais', example: '95.00' })
  @Expose({ name: 'totais_aproximados_tributos_municipais' })
  totaisAproximadosTributosMunicipais: string | null;
}
