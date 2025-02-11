import { BatchProcess } from '../../domain/entities/batch-process.entity';
import { FileToProcess } from '../../domain/entities/file-process.entity';

export abstract class WebhookNotifierPort {
  /**
   * Sends a success notification to the configured webhook URL
   * @param process The completed document process
   */
  abstract notifySuccess(process: FileToProcess): Promise<void>;

  /**
   * Sends a failure notification to the configured webhook URL
   * @param process The failed document process
   */
  abstract notifyFailure(process: FileToProcess): Promise<void>;

  abstract notifyBatchCompleted(batch: BatchProcess): Promise<void>;
}
