import { Injectable, BadRequestException } from '@nestjs/common';
import { CalculateBatchCostDto } from '../dtos/calculate-batch-cost.dto';
import { PriceModelDbPort } from '../ports/price-model-db.port';
import { BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';

@Injectable()
export class CalculateBatchCostUseCase {
  constructor(
    private readonly priceModelRepository: PriceModelDbPort,
    private readonly batchPort: BatchDbPort,
  ) {}

  async execute(params: CalculateBatchCostDto): Promise<number> {
    const { batchId, processCode } = params;

    // Find the batch
    const batch = await this.batchPort.findById(batchId);
    if (!batch) {
      throw new BadRequestException(`Batch with ID ${batchId} not found or does not belong to user`);
    }

    // Check if batch is in created status
    if (batch.status !== BatchStatus.CREATED) {
      throw new BadRequestException('Cannot calculate cost for a batch that has already started');
    }

    // Get the process code from the batch's template if not provided
    let batchProcessCode = processCode;
    if (!batchProcessCode) {
      // Need to unwrap the template reference
      const template = await batch.template.load();
      if (!template) {
        throw new BadRequestException('Template not found for batch');
      }
      batchProcessCode = template.processCode;
    }

    // Find the price model for the process
    const priceModel = await this.priceModelRepository.findDefaultByProcessCode(batchProcessCode);
    if (!priceModel) {
      throw new BadRequestException(`No price model found for process code ${batchProcessCode}`);
    }

    // Calculate the cost based on the number of files in the batch
    const fileCount = batch.totalFiles;
    const totalCost = priceModel.calculateCost(fileCount);

    return totalCost;
  }
}
