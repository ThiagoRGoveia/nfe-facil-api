import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBatchDto } from '@/core/documents/application/dtos/create-batch.dto';
import { CreateBatchProcessUseCase } from '@/core/documents/application/use-cases/create-batch-process.use-case';
import { UpdateBatchTemplateUseCase } from '@/core/documents/application/use-cases/update-batch-template.use-case';
import { AddFileToBatchUseCase } from '@/core/documents/application/use-cases/add-file-to-batch.use-case';
import { CancelBatchProcessUseCase } from '@/core/documents/application/use-cases/cancel-batch-process.use-case';
import { AsyncBatchProcessUseCase } from '@/core/documents/application/use-cases/async-batch-process.use-case';
import { SyncBatchProcessUseCase } from '@/core/documents/application/use-cases/sync-batch-process.use-case';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from '@/infra/express/types/request';
import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly createBatchUseCase: CreateBatchProcessUseCase,
    private readonly updateBatchTemplateUseCase: UpdateBatchTemplateUseCase,
    private readonly addFileToBatchUseCase: AddFileToBatchUseCase,
    private readonly cancelBatchUseCase: CancelBatchProcessUseCase,
    private readonly asyncBatchProcessUseCase: AsyncBatchProcessUseCase,
    private readonly syncBatchProcessUseCase: SyncBatchProcessUseCase,
    private readonly batchDbPort: BatchDbPort,
  ) {}

  @Post('process/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process batch synchronously' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch processed successfully' })
  async processBatchSync(
    @Req() req: Request,
    @Body() createBatchDto: CreateBatchDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createBatchDto.file = file.buffer;
      createBatchDto.fileName = file.originalname;
    }
    await this.syncBatchProcessUseCase.execute(req.user, createBatchDto);
  }

  @Get('batch/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get batch process' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch process retrieved successfully' })
  async getBatch(@Param('id') batchId: string) {
    return await this.batchDbPort.findByIdOrFail(batchId);
  }

  @Get('batch/:id/files')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get batch files' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch files retrieved successfully' })
  async getBatchFiles(@Param('id') batchId: string) {
    const batch = await this.batchDbPort.findByIdOrFail(batchId);
    await batch.files.load();
    return batch.files;
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a new batch process' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Batch created successfully' })
  async createBatch(
    @Req() req: Request,
    @Body('templateId') templateId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return await this.createBatchUseCase.execute(req.user, {
      templateId,
      file: file?.buffer,
      fileName: file?.originalname,
    });
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

  @Post('batch/:id/files')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Add file to batch' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'File added successfully' })
  async addFileToBatch(@Req() req: Request, @Param('id') batchId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return await this.addFileToBatchUseCase.execute({
      batchId,
      file: file.stream,
      filename: file.originalname,
      mimetype: file.mimetype,
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
