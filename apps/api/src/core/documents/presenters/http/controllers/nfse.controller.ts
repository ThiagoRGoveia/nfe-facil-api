import {
  BadRequestException,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateBatchProcessUseCase } from '@/core/documents/application/use-cases/create-batch-process.use-case';
import { AddFileToBatchUseCase } from '@/core/documents/application/use-cases/add-file-to-batch.use-case';
import { CancelBatchProcessUseCase } from '@/core/documents/application/use-cases/cancel-batch-process.use-case';
import { AsyncBatchProcessUseCase } from '@/core/documents/application/use-cases/async-batch-process.use-case';
import { SyncFileProcessUseCase } from '@/core/documents/application/use-cases/sync-file-process.use-case';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from '@/infra/express/types/request';
import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';
import { MAX_FILE_SIZE_BYTES } from '@/infra/constants/max-file-size.constant';
import { ConfigService } from '@nestjs/config';

/**
 * Controlador para processamento de Notas Fiscais de Serviço Eletrônicas (NFSe).
 *
 * Os dados extraídos do processamento seguem a estrutura definida em {@link NfseDto},
 * disponível em "apps/template-process/src/workflows/nfe/dto/nfse.dto.ts".
 *
 * Para receber notificações sobre o processamento de NFSe, consulte o controlador
 * de webhooks em {@link NFSeWebhooksController}.
 */
@ApiTags('NFSe')
@Controller('nfse')
@Injectable()
export class NFSeController {
  private readonly templateId: string;

  constructor(
    private readonly createBatchUseCase: CreateBatchProcessUseCase,
    private readonly addFileToBatchUseCase: AddFileToBatchUseCase,
    private readonly cancelBatchUseCase: CancelBatchProcessUseCase,
    private readonly asyncBatchProcessUseCase: AsyncBatchProcessUseCase,
    private readonly syncBatchProcessUseCase: SyncFileProcessUseCase,
    private readonly batchDbPort: BatchDbPort,
    private readonly configService: ConfigService,
  ) {
    const templateId = this.configService.get<string>('NFSE_TEMPLATE_ID');
    if (!templateId) {
      throw new Error('NFSE_TEMPLATE_ID não configurado no ambiente');
    }
    this.templateId = templateId;
  }

  @Post('processar')
  @ApiOperation({ summary: 'Processar lote de NFSe de forma síncrona' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lote de NFSe processado com sucesso' })
  @UseInterceptors(FilesInterceptor('files'))
  async processBatchSync(
    @Req() req: Request,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES }),
          new FileTypeValidator({
            fileType: /^(application\/zip|application\/pdf|application\/octet-stream)$/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    files: Express.Multer.File[],
  ) {
    return await this.syncBatchProcessUseCase.execute(req.user, {
      templateId: this.templateId,
      files: files.map((f) => ({
        data: f.buffer,
        fileName: f.originalname,
      })),
    });
  }

  @Post('processar/lote')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo lote de processamento de NFSe' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Lote de NFSe criado com sucesso' })
  @UseInterceptors(FilesInterceptor('files'))
  async createBatch(
    @Req() req: Request,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES }),
          new FileTypeValidator({
            fileType: /^(application\/zip|application\/pdf|application\/octet-stream)$/,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    files?: Express.Multer.File[],
  ) {
    return await this.createBatchUseCase.execute(req.user, {
      templateId: this.templateId,
      files: files?.map((f) => ({
        data: f.buffer,
        fileName: f.originalname,
      })),
    });
  }

  @Get('lote/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter informações de um lote de NFSe' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Informações do lote de NFSe recuperadas com sucesso' })
  async getBatch(@Param('id') batchId: string) {
    return await this.batchDbPort.findByIdOrFail(batchId);
  }

  @Put('lote/:id/arquivos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adicionar arquivo a um lote de NFSe' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Arquivo adicionado ao lote de NFSe com sucesso' })
  @UseInterceptors(FilesInterceptor('files'))
  async addFileToBatch(
    @Req() req: Request,
    @Param('id') batchId: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES })],
      }),
    )
    files: Express.Multer.File[],
  ) {
    if (!files) {
      throw new BadRequestException('Arquivo é obrigatório');
    }
    return await this.addFileToBatchUseCase.execute({
      batchId,
      files: files.map((f) => ({
        file: f.buffer,
        filename: f.originalname,
        mimetype: f.mimetype,
      })),
      user: req.user,
    });
  }

  @Delete('lote/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar processamento de lote de NFSe' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Processamento de lote de NFSe cancelado com sucesso' })
  async cancelBatch(@Param('id') batchId: string) {
    await this.cancelBatchUseCase.execute(batchId);
  }

  @Post('lote/:id/processar')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Processar lote de NFSe de forma assíncrona' })
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: 'Processamento de lote de NFSe iniciado' })
  async processBatchAsync(@Param('id') batchId: string) {
    await this.asyncBatchProcessUseCase.execute(batchId);
  }
}
