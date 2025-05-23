import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateBatchProcessUseCase } from '@/core/documents/application/use-cases/create-batch-process.use-case';
import { UpdateBatchTemplateUseCase } from '@/core/documents/application/use-cases/update-batch-template.use-case';
import { AddFileToBatchUseCase } from '@/core/documents/application/use-cases/add-file-to-batch.use-case';
import { CancelBatchProcessUseCase } from '@/core/documents/application/use-cases/cancel-batch-process.use-case';
import { AsyncBatchProcessUseCase } from '@/core/documents/application/use-cases/async-batch-process.use-case';
import { SyncFileProcessUseCase } from '@/core/documents/application/use-cases/sync-file-process.use-case';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from '@/infra/express/types/request';
import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';
import { MAX_FILE_SIZE_BYTES } from '@/infra/constants/max-file-size.constant';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly createBatchUseCase: CreateBatchProcessUseCase,
    private readonly updateBatchTemplateUseCase: UpdateBatchTemplateUseCase,
    private readonly addFileToBatchUseCase: AddFileToBatchUseCase,
    private readonly cancelBatchUseCase: CancelBatchProcessUseCase,
    private readonly asyncBatchProcessUseCase: AsyncBatchProcessUseCase,
    private readonly syncBatchProcessUseCase: SyncFileProcessUseCase,
    private readonly batchDbPort: BatchDbPort,
  ) {}

  @Post('process/sync')
  @ApiOperation({ summary: 'Process batch synchronously' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch processed successfully' })
  @UseInterceptors(FilesInterceptor('files'))
  async processBatchSync(
    @Req() req: Request,
    @Body('templateId') templateId: string,
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
      templateId,
      files: files.map((f) => ({
        data: f.buffer,
        fileName: f.originalname,
      })),
    });
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new batch process' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Batch created successfully' })
  @UseInterceptors(FilesInterceptor('files'))
  async createBatch(
    @Req() req: Request,
    @Body('templateId') templateId: string,
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
      templateId,
      files: files?.map((f) => ({
        data: f.buffer,
        fileName: f.originalname,
      })),
      outputFormats,
    });
  }

  @Get('batch/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get batch process' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch process retrieved successfully' })
  async getBatch(@Param('id') batchId: string) {
    return await this.batchDbPort.findByIdOrFail(batchId);
  }

  @Patch('batch/:id/template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update batch template' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Template updated successfully' })
  async updateBatchTemplate(@Req() req: Request, @Param('id') batchId: string, @Body('templateId') templateId: string) {
    await this.updateBatchTemplateUseCase.execute({
      batchId,
      templateId,
      user: req.user,
    });
  }

  @Put('batch/:id/files')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add file to batch' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File added successfully' })
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
      throw new BadRequestException('File is required');
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

  @Delete('batch/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel batch process' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Batch cancelled successfully' })
  async cancelBatch(@Param('id') batchId: string) {
    await this.cancelBatchUseCase.execute(batchId);
  }

  @Post('batch/:id/process')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Process batch asynchronously' })
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: 'Batch processing started' })
  async processBatchAsync(@Param('id') batchId: string) {
    await this.asyncBatchProcessUseCase.execute(batchId);
  }
}
