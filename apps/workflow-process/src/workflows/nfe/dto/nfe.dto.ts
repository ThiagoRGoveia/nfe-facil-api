import { IsString, IsEmail, IsOptional, Matches } from 'class-validator';

export class NfeDto {
  @IsString()
  @IsOptional()
  @Matches(/^\d{50}$/)
  chaveAcessoNfsE?: string;

  @IsString()
  @IsOptional()
  prefeituraMunicipal?: string;

  @IsString()
  @IsOptional()
  autenticidadeNfsE?: string;

  @IsString()
  @IsOptional()
  numeroNfsE?: string;

  @IsString()
  @IsOptional()
  competenciaNfsE?: string;

  @IsString()
  @IsOptional()
  dataHoraEmissaoNfsE?: string;

  @IsString()
  @IsOptional()
  numeroDps?: string;

  @IsString()
  @IsOptional()
  serieDps?: string;

  @IsString()
  @IsOptional()
  dataHoraEmissaoDps?: string;

  @IsString()
  @IsOptional()
  emitenteNfsEPrestadorServicoCnpjCpfNif?: string;

  @IsString()
  @IsOptional()
  emitenteNfsEInscricaoMunicipal?: string;

  @IsString()
  @IsOptional()
  emitenteNfsETelefone?: string;

  @IsString()
  @IsOptional()
  emitenteNfsENomeNomeEmpresarial?: string;

  @IsEmail()
  @IsOptional()
  emitenteNfsEEmail?: string;

  @IsString()
  @IsOptional()
  emitenteNfsEEnderecoLogradouro?: string;

  @IsString()
  @IsOptional()
  emitenteNfsEEnderecoNumero?: string;

  @IsString()
  @IsOptional()
  emitenteNfsEEnderecoBairro?: string;

  @IsString()
  @IsOptional()
  emitenteNfsEMunicipio?: string;

  @IsString()
  @IsOptional()
  emitenteNfsECep?: string;

  @IsString()
  @IsOptional()
  emitenteNfsESimplesNacionalDataCompetencia?: string;

  @IsString()
  @IsOptional()
  emitenteNfsERegimeApuracaoTributariaSn?: string;

  @IsString()
  @IsOptional()
  tomadorServicoCnpjCpfNif?: string;

  @IsString()
  @IsOptional()
  tomadorServicoInscricaoMunicipal?: string;

  @IsString()
  @IsOptional()
  tomadorServicoTelefone?: string;

  @IsString()
  @IsOptional()
  tomadorServicoNomeNomeEmpresarial?: string;

  @IsEmail()
  @IsOptional()
  tomadorServicoEmail?: string;

  @IsString()
  @IsOptional()
  tomadorServicoEnderecoLogradouro?: string;

  @IsString()
  @IsOptional()
  tomadorServicoEnderecoNumero?: string;

  @IsOptional()
  @IsString()
  tomadorServicoEnderecoAndar?: string;

  @IsOptional()
  @IsString()
  tomadorServicoEnderecoSala?: string;

  @IsString()
  @IsOptional()
  tomadorServicoEnderecoBairro?: string;

  @IsString()
  @IsOptional()
  tomadorServicoMunicipio?: string;

  @IsString()
  @IsOptional()
  tomadorServicoCep?: string;

  @IsOptional()
  @IsString()
  intermediarioServicoIdentificadoNfsE?: string;

  @IsString()
  @IsOptional()
  servicoPrestadoCodigoTributacaoNacional?: string;

  @IsString()
  @IsOptional()
  servicoPrestadoCodigoTributacaoMunicipal?: string;

  @IsString()
  @IsOptional()
  servicoPrestadoLocalPrestacao?: string;

  @IsString()
  @IsOptional()
  servicoPrestadoPaisPrestacao?: string;

  @IsString()
  @IsOptional()
  servicoPrestadoDescricaoServico?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalTributacaoIssqnOperacaoTributavel?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalPaisResultadoPrestacaoServico?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalMunicipioIncidenciaIssqn?: string;

  @IsOptional()
  @IsString()
  tributacaoMunicipalRegimeEspecialTributacao?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalTipoImunidade?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalSuspensaoExigibilidadeIssqn?: string;

  @IsOptional()
  @IsString()
  tributacaoMunicipalNumeroProcessoSuspensao?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalBeneficioMunicipal?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalValorServico?: string;

  @IsOptional()
  @IsString()
  tributacaoMunicipalDescontoIncondicionado?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalTotalDeducoesReducoes?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalCalculoBm?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalBcIssqn?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalAlotacaoAplicada?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalRetencoesIssqn?: string;

  @IsString()
  @IsOptional()
  tributacaoMunicipalIssqnApurado?: string;

  @IsString()
  @IsOptional()
  tributacaoFederalIrrf?: string;

  @IsString()
  @IsOptional()
  tributacaoFederalCp?: string;

  @IsString()
  @IsOptional()
  tributacaoFederalCsll?: string;

  @IsString()
  @IsOptional()
  tributacaoFederalPis?: string;

  @IsString()
  @IsOptional()
  tributacaoFederalCofins?: string;

  @IsString()
  @IsOptional()
  tributacaoFederalRetencoesPisCofins?: string;

  @IsString()
  @IsOptional()
  tributacaoFederalTotalTributosFederais?: string;

  @IsString()
  @IsOptional()
  valorTotalNfsEValorServico?: string;

  @IsString()
  @IsOptional()
  valorTotalNfsEDescontoCondicionado?: string;

  @IsString()
  @IsOptional()
  valorTotalNfsEDescontoIncondicionado?: string;

  @IsString()
  @IsOptional()
  valorTotalNfsEIssqnRetido?: string;

  @IsString()
  @IsOptional()
  valorTotalNfsEIrrfCpCsllRetidos?: string;

  @IsString()
  @IsOptional()
  valorTotalNfsEPisCofinsRetidos?: string;

  @IsString()
  @IsOptional()
  valorTotalNfsEValorLiquidoNfsE?: string;

  @IsString()
  @IsOptional()
  totasAproximadosTributosFederais?: string;

  @IsString()
  @IsOptional()
  totasAproximadosTributosEstaduais?: string;

  @IsString()
  @IsOptional()
  totasAproximadosTributosMunicipais?: string;
}
