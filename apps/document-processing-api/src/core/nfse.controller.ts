import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  HttpStatus,
  Injectable,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBasicAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Request } from '@lib/commons/types/express/request';
import { MAX_FILE_SIZE_BYTES } from '@lib/commons/constants/max-file-size.constant';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { SyncFileProcessUseCase } from '@lib/workflows/core/application/use-cases/sync-file-process.use-case';
import { NfseResponseDto } from '@lib/documents/core/presenters/http/dtos/nfse-response.dto';
import { SingleFileUploadDto } from '@lib/documents/core/presenters/http/dtos/single-file-upload.dto';

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
    private readonly syncBatchProcessUseCase: SyncFileProcessUseCase,
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
}
