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
  UploadedFile,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBasicAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Request } from '@/infra/express/types/request';
import { MAX_FILE_SIZE_BYTES } from '@lib/commons/constants/max-file-size.constant';
import { ConfigService } from '@nestjs/config';
import { FileUploadDto, FileUploadWithFormatsDto } from '../dtos/file-upload.dto';
import { SingleFileUploadDto } from '../dtos/single-file-upload.dto';
import { plainToInstance } from 'class-transformer';
import { NfseResponseDto } from '../dtos/nfse-response.dto';
import { BatchProcessResponseDto } from '../dtos/batch-process-response.dto';
import { CreateBatchProcessUseCase } from '@lib/documents/core/application/use-cases/create-batch-process.use-case';
import { BatchDbPort } from '@lib/documents/core/application/ports/batch-db.port';
import { SyncFileProcessUseCase } from '@lib/workflows/core/application/use-cases/sync-file-process.use-case';
import { AsyncBatchProcessUseCase } from '@lib/documents/core/application/use-cases/async-batch-process.use-case';
import { CancelBatchProcessUseCase } from '@lib/documents/core/application/use-cases/cancel-batch-process.use-case';
import { AddFileToBatchUseCase } from '@lib/documents/core/application/use-cases/add-file-to-batch.use-case';

/**
 * Controlador para processamento de Notas Fiscais de Serviço Eletrônicas (NFSe).
 *
 * Este módulo oferece funcionalidades completas para o processamento de NFSe, incluindo:
 * - Criação e gerenciamento de lotes de NFSe
 * - Processamento síncrono e assíncrono de arquivos
 * - Adição de arquivos a lotes existentes
 * - Cancelamento de processamento de lotes
 *
 * Os dados extraídos do processamento seguem a estrutura definida em {@link NfseDto},
 * disponível em "apps/document-process/src/workflows/nfe/dto/nfse.dto.ts".
 *
 * Para receber notificações sobre o processamento de NFSe, consulte o controlador
 * de webhooks em {@link NFSeWebhooksController}.
 *
 * Para melhor entendimento do fluxo de processamento, consulte o diagrama disponível em:
 * /diagrams/nfse-flow-diagram.png
 *
 * Este é um dos módulos da API de Documentos Fiscais Eletrônicos, que será expandido
 * com novos módulos para outros tipos de documentos fiscais no futuro.
 */
@ApiTags('NFSe')
@Controller('nfse')
@ApiBasicAuth()
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

  @Post('extrair')
  @ApiOperation({
    summary: 'Processar um único arquivo de NFSe de forma síncrona',
    description:
      'Realiza a extração de dados de um único arquivo de NFSe de forma síncrona. Este endpoint aceita apenas um arquivo PDF e retorna os dados extraídos em formato camelCase. O processamento é realizado de forma imediata e a resposta contém os dados estruturados da NFSe.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'NFSe processada com sucesso. Retorna os dados extraídos em formato camelCase.',
    type: NfseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Erro de validação no arquivo enviado ou formato incompatível.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: SingleFileUploadDto })
  @UseInterceptors(FileInterceptor('file'))
  async processSingleFile(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES, message: 'O arquivo enviado é muito grande.' }),
          new FileTypeValidator({
            fileType: /^(application\/pdf)$/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const result = await this.syncBatchProcessUseCase.execute(req.user, {
        templateId: this.templateId,
        consolidateOutput: false,
        files: [
          {
            data: file.buffer,
            fileName: file.originalname,
          },
        ],
      });

      if (!result || !result.files || result.files.length === 0) {
        throw new BadRequestException('Nenhum resultado de processamento encontrado');
      }

      const fileRecord = result.files[0];
      if (!fileRecord.result) {
        throw new BadRequestException('Falha ao processar o arquivo');
      }

      return plainToInstance(NfseResponseDto, fileRecord.result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Error processing single file', error);
      throw error;
    }
  }

  @Post('extrair/lote')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar um novo lote de processamento de NFSe',
    description:
      'Cria um novo lote para extração assíncrona de dados de arquivos de NFSe. Este endpoint permite iniciar um lote vazio ou com arquivos iniciais. É a primeira etapa do fluxo assíncrono, ideal para processamento em lote de grandes volumes de arquivos. Consulte o diagrama em /diagrams/nfse-flow-diagram.png para melhor entendimento.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lote de NFSe criado com sucesso. Retorna os detalhes do lote criado.',
    type: BatchProcessResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadWithFormatsDto })
  @UseInterceptors(FilesInterceptor('files', 10))
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
    const outputFormats = req.body.outputFormats
      ? Array.isArray(req.body.outputFormats)
        ? req.body.outputFormats
        : [req.body.outputFormats] // Converter para array se for uma string única
      : undefined;
    return await this.createBatchUseCase.execute(req.user, {
      templateId: this.templateId,
      files: files?.map((f) => ({
        data: f.buffer,
        fileName: f.originalname,
      })),
      outputFormats,
    });
  }

  @Get('lote/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter informações de um lote extração de NFSe',
    description:
      'Recupera informações detalhadas sobre um lote específico de NFSe, incluindo seu status atual, quantidade de arquivos e resultados de processamento (se concluído).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Informações do lote recuperadas com sucesso.',
    type: BatchProcessResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lote não encontrado com o ID especificado.',
  })
  async getBatch(@Param('id') batchId: string) {
    return await this.batchDbPort.findByIdOrFail(batchId);
  }

  @Put('lote/:id/arquivos')
  @ApiOperation({
    summary: 'Adicionar arquivos a um lote existente',
    description:
      'Permite adicionar novos arquivos a um lote de processamento já existente. Útil para agregar mais NFSe a um lote antes de iniciar seu processamento assíncrono. Os arquivos são validados antes de serem adicionados ao lote.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Arquivos adicionados ao lote com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lote não encontrado com o ID especificado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Erro de validação nos arquivos enviados ou lote em estado que não permite adição de arquivos.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  @UseInterceptors(FilesInterceptor('files'))
  @HttpCode(HttpStatus.ACCEPTED)
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
    await this.addFileToBatchUseCase.execute({
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
  @ApiOperation({
    summary: 'Cancelar processamento de lote de NFSe',
    description:
      'Cancela o processamento de um lote existente. Se o lote já estiver em processamento, tenta interromper as operações em andamento. Lotes já processados não podem ser cancelados.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Processamento de lote cancelado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lote não encontrado com o ID especificado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Lote não pode ser cancelado no estado atual.',
  })
  async cancelBatch(@Param('id') batchId: string) {
    await this.cancelBatchUseCase.execute(batchId);
  }

  @Post('lote/:id/processar')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Processar lote de NFSe de forma assíncrona',
    description:
      'Inicia o processamento assíncrono de um lote de NFSe. Este endpoint retorna imediatamente após iniciar o processamento em segundo plano, permitindo o processamento eficiente de grandes volumes de arquivos. O progresso pode ser acompanhado consultando o status do lote, e notificações via webhook podem ser configuradas para informar sobre a conclusão. Para entender o fluxo completo, consulte o diagrama em /diagrams/nfse-flow-diagram.png',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Processamento assíncrono iniciado com sucesso. O resultado estará disponível posteriormente.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lote não encontrado com o ID especificado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Lote em estado que não permite processamento ou sem arquivos para processar.',
  })
  async processBatchAsync(@Param('id') batchId: string) {
    await this.asyncBatchProcessUseCase.execute(batchId);
  }
}
