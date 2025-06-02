import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiExtraModels,
  refs,
  ApiBasicAuth,
} from '@nestjs/swagger';
import { CreateWebhookDto } from '@lib/webhooks/core/application/dtos/create-webhook.dto';
import { UpdateWebhookDto } from '@lib/webhooks/core/application/dtos/update-webhook.dto';
import { Webhook } from '@lib/webhooks/core/domain/entities/webhook.entity';
import { WebhookEvent } from '@lib/webhooks/core/domain/entities/webhook.entity';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { PaginatedRestResponse } from '@lib/commons/dtos/paginated-response.factory';
import { Request } from '@lib/commons/types/express/request';
import { RestQueryDto } from '@lib/commons/dtos/rest.query.dto';
import { PaginatedResponse } from '@lib/commons/types/paginated-response.type';
import { SortDirection } from '@lib/commons/dtos/sort.dto';
// Import Portuguese DTOs for documentation
import { BasicAuthConfigInputPt, CreateWebhookPtDto, OAuth2ConfigInputPt } from '../dtos/create-webhook-pt.dto';
import { UpdateWebhookPtDto } from '../dtos/update-webhook-pt.dto';
import { WebhookResponsePtDto } from '../dtos/webhook-response-pt.dto';
import {
  DocumentProcessedPayloadPtDto,
  DocumentFailedPayloadPtDto,
  BatchFinishedPayloadPtDto,
} from '../dtos/webhook-events-pt.dto';
import { NotifyWebhookDto } from '@lib/webhooks/core/application/dtos/notify-webhook.dto';
import { WebhookDbPort } from '@lib/webhooks/core/application/ports/webhook-db.port';
import { CreateWebhookUseCase } from '@lib/webhooks/core/application/use-cases/create-webhook.use-case';
import { UpdateWebhookUseCase } from '@lib/webhooks/core/application/use-cases/update-webhook.use-case';
import { DeleteWebhookUseCase } from '@lib/webhooks/core/application/use-cases/delete-webhook.use-case';
import { NotifyWebhookUseCase } from '@lib/webhook-dispatcher/core/application/use-cases/notify-webhook.use-case';

const PaginatedWebhookResponse = PaginatedRestResponse(Webhook);

/**
 * Controlador para gerenciamento de webhooks específicos para processamento de NFSe.
 * Os eventos disponíveis para notificação são:
 * - ${WebhookEvent.DOCUMENT_PROCESSED}: Quando uma NFSe é processada com sucesso
 * - ${WebhookEvent.DOCUMENT_FAILED}: Quando ocorre uma falha no processamento de uma NFSe
 * - ${WebhookEvent.BATCH_FINISHED}: Quando um lote completo de NFSe é finalizado
 */
@ApiTags('Webhooks')
@ApiBasicAuth()
@Controller('webhooks')
export class NFSeWebhooksController {
  constructor(
    private readonly webhookDbPort: WebhookDbPort,
    private readonly createWebhookUseCase: CreateWebhookUseCase,
    private readonly updateWebhookUseCase: UpdateWebhookUseCase,
    private readonly deleteWebhookUseCase: DeleteWebhookUseCase,
    private readonly notifyWebhookUseCase: NotifyWebhookUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar um novo webhook para NFSe',
    description:
      'Cria um novo endpoint de webhook para receber notificações relacionadas ao processamento de NFSe. ' +
      'Os eventos disponíveis são: \n\n' +
      `• **${WebhookEvent.DOCUMENT_PROCESSED}**: Enviado quando uma NFSe é processada com sucesso. ` +
      'O payload contém os dados extraídos da NFSe, ID do documento, status, nome do arquivo e data de processamento.\n\n' +
      `• **${WebhookEvent.DOCUMENT_FAILED}**: Enviado quando ocorre uma falha no processamento de uma NFSe. ` +
      'O payload contém o ID do documento, a mensagem de erro, nome do arquivo e data da falha.\n\n' +
      `• **${WebhookEvent.BATCH_FINISHED}**: Enviado quando um lote completo de NFSe é finalizado. ` +
      'O payload contém o ID do lote processado.',
  })
  @ApiBody({ type: CreateWebhookPtDto, description: 'Dados para criação do webhook' })
  @ApiExtraModels(BasicAuthConfigInputPt, OAuth2ConfigInputPt)
  @ApiCreatedResponse({ type: WebhookResponsePtDto, description: 'Webhook criado com sucesso' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados de entrada inválidos' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() createWebhookDto: CreateWebhookDto): Promise<Webhook> {
    return this.createWebhookUseCase.execute({
      user: req.user,
      data: createWebhookDto,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter webhook por ID',
    description: 'Recupera informações detalhadas de um webhook específico configurado para NFSe pelo seu ID.',
  })
  @ApiOkResponse({ type: WebhookResponsePtDto, description: 'Webhook encontrado' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Webhook não encontrado' })
  async findOne(@Param('id') id: string): Promise<Webhook> {
    return this.webhookDbPort.findByIdOrFail(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os webhooks de NFSe',
    description: 'Retorna uma lista paginada de todos os webhooks configurados para o processamento de NFSe.',
  })
  @ApiOkResponse({ type: PaginatedWebhookResponse, description: 'Lista paginada de webhooks' })
  async findAll(@Req() req: Request, @Query() query: RestQueryDto): Promise<PaginatedResponse<Webhook>> {
    const pagination = query.toPagination();
    const sort = query.toSort();
    const defaultSort = { field: 'createdAt', direction: SortDirection.DESC };

    if (req.user.role === UserRole.ADMIN) {
      return this.webhookDbPort.findAll(undefined, pagination, { ...defaultSort, ...sort });
    }
    return this.webhookDbPort.findByUser(req.user.id, undefined, pagination, { ...defaultSort, ...sort });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar webhook',
    description: 'Atualiza as configurações de um webhook existente para o processamento de NFSe.',
  })
  @ApiBody({ type: UpdateWebhookPtDto, description: 'Dados de atualização do webhook' })
  @ApiOkResponse({ type: WebhookResponsePtDto, description: 'Webhook atualizado com sucesso' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Webhook não encontrado' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permissões insuficientes' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ): Promise<Webhook> {
    return this.updateWebhookUseCase.execute({
      user: req.user,
      id,
      data: updateWebhookDto,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir webhook',
    description: 'Remove um webhook configurado para o processamento de NFSe.',
  })
  @ApiNoContentResponse({ description: 'Webhook excluído com sucesso' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Webhook não encontrado' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permissões insuficientes' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    await this.deleteWebhookUseCase.execute({
      user: req.user,
      id,
    });
  }

  @Post('notificar')
  @ApiOperation({
    summary: 'Acionar notificações de webhook',
    description:
      'Dispara manualmente notificações para webhooks registrados no contexto de processamento de NFSe (Utilizado para testes).\n\n' +
      '**Estruturas de Payload por Evento:**\n\n' +
      `• **${WebhookEvent.DOCUMENT_PROCESSED}**: \n` +
      '```json\n' +
      '{\n' +
      '  "documentId": "123e4567-e89b-12d3-a456-426614174000",\n' +
      '  "status": "PROCESSED",\n' +
      '  "fileName": "nfse_12345.pdf",\n' +
      '  "processedAt": "2023-09-15T14:30:15.123Z",\n' +
      '  "batchId": "123e4567-e89b-12d3-a456-426614174001",\n' +
      '  "result": { /* Dados extraídos da NFSe */ }\n' +
      '}\n' +
      '```\n\n' +
      `• **${WebhookEvent.DOCUMENT_FAILED}**: \n` +
      '```json\n' +
      '{\n' +
      '  "documentId": "123e4567-e89b-12d3-a456-426614174000",\n' +
      '  "error": "Não foi possível extrair os dados do documento: formato inválido",\n' +
      '  "fileName": "nfse_12345.pdf",\n' +
      '  "failedAt": "2023-09-15T14:30:15.123Z",\n' +
      '  "batchId": "123e4567-e89b-12d3-a456-426614174001"\n' +
      '}\n' +
      '```\n\n' +
      `• **${WebhookEvent.BATCH_FINISHED}**: \n` +
      '```json\n' +
      '{\n' +
      '  "batchId": "123e4567-e89b-12d3-a456-426614174001"\n' +
      '}\n' +
      '```\n',
  })
  @ApiBody({
    schema: {
      anyOf: refs(DocumentProcessedPayloadPtDto, DocumentFailedPayloadPtDto, BatchFinishedPayloadPtDto),
    },
    description: 'Payload de notificação de webhook baseado no tipo de evento',
    examples: {
      documentProcessed: {
        summary: `Exemplo para evento ${WebhookEvent.DOCUMENT_PROCESSED}`,
        value: {
          event: WebhookEvent.DOCUMENT_PROCESSED,
          timestamp: '2023-09-15T14:30:15.123Z',
          payload: {
            documentId: '123e4567-e89b-12d3-a456-426614174000',
            status: 'PROCESSED',
            fileName: 'nfse_12345.pdf',
            processedAt: new Date().toISOString(),
            batchId: '123e4567-e89b-12d3-a456-426614174001',
            result: {
              chave_acesso_nfse: '12345678901234567890123456789012345678901234567890',
              numero_nfse: '123456',
              // Dados simplificados para exemplo
            },
          },
        },
      },
      documentFailed: {
        summary: `Exemplo para evento ${WebhookEvent.DOCUMENT_FAILED}`,
        value: {
          event: WebhookEvent.DOCUMENT_FAILED,
          payload: {
            documentId: '123e4567-e89b-12d3-a456-426614174000',
            error: 'Não foi possível extrair os dados do documento: formato inválido',
            fileName: 'nfse_12345.pdf',
            failedAt: new Date().toISOString(),
            batchId: '123e4567-e89b-12d3-a456-426614174001',
          },
        },
      },
      batchFinished: {
        summary: `Exemplo para evento ${WebhookEvent.BATCH_FINISHED}`,
        value: {
          event: WebhookEvent.BATCH_FINISHED,
          payload: {
            batchId: '123e4567-e89b-12d3-a456-426614174001',
          },
        },
      },
    },
  })
  @ApiExtraModels(DocumentProcessedPayloadPtDto, DocumentFailedPayloadPtDto, BatchFinishedPayloadPtDto)
  @ApiOkResponse({ description: 'Notificações disparadas com sucesso' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados de entrada inválidos' })
  @HttpCode(HttpStatus.OK)
  notify(@Req() req: Request, @Body() notifyDto: NotifyWebhookDto): Promise<void> {
    return this.notifyWebhookUseCase.execute({
      user: req.user,
      ...notifyDto,
    });
  }
}
