import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { NFSeDocModule } from './nfse-doc.module';
import { SwaggerModule } from '@nestjs/swagger';

dotenv.config();

type CustomDocument = Omit<OpenAPIObject, 'paths'> & {
  info: OpenAPIObject['info'] & {
    'x-logo'?: {
      url: string;
      backgroundColor: string;
      altText: string;
    };
  };
};

export function setupNFSeDocs() {
  const config: CustomDocument = new DocumentBuilder()
    .addServer(process.env.API_URL || 'http://localhost:4000')
    .setTitle('NFe-Fácil API')
    .setDescription(
      `
      API para extração de dados de Notas Fiscais Eletrônicas de Serviço (NFSe).
      Permite o processamento, consulta e gerenciamento de lotes de NFSe,
      incluindo operações síncronas e assíncronas.
      
      A NFSe é o documento fiscal eletrônico que comprova a prestação de serviços,
      sendo obrigatório para empresas e profissionais autônomos.
      
      Principais funcionalidades:
       - Extração de dados de NFSe de arquivos PDF e ZIP síncrona e assíncrona
       - Webhooks para notificação de status de processamento
    `,
    )
    .addTag('Autenticação', `Utilize API Key and Secret gerados no Dashboard da NFe-Fácil para autenticação.`)
    .addTag(
      'NFSe',
      `Módulo para processamento de Notas Fiscais de Serviço Eletrônicas (NFSe). 
  Oferece funcionalidades completas para criação, gerenciamento e processamento de lotes de NFSe, 
  tanto de forma síncrona quanto assíncrona. Este módulo faz parte da API de Documentos Fiscais 
  Eletrônicos, que será expandida com novos módulos para outros tipos de documentos no futuro.`,
    )
    .setVersion(process.env.API_VERSION || '1.0.0')
    .addBasicAuth()
    .build();

  config.info['x-logo'] = {
    url: process.env.LOGO_URL || '',
    backgroundColor: '#EFEFF2',
    altText: 'NFe-Fácil logo',
  };
  return config;
}

async function run() {
  const config = setupNFSeDocs();
  const app = await NestFactory.create(NFSeDocModule);
  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('nfe-facil-docs.json', JSON.stringify(document, null, 2));
  await app.close();
}

run().catch(console.error);
