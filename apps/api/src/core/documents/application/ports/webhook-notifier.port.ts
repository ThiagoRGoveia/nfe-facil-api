import { BatchProcess } from '../../domain/entities/batch-process.entity';
import { FileRecord } from '../../domain/entities/file-records.entity';

export abstract class WebhookNotifierPort {
  /**
   * Sends a success notification to the configured webhook URL
   * @param process The completed document process
   */
  abstract notifySuccess(process: FileRecord): Promise<void>;

  /**
   * Sends a failure notification to the configured webhook URL
   * @param process The failed document process
   */
  abstract notifyFailure(process: FileRecord): Promise<void>;

  abstract notifyBatchCompleted(batch: BatchProcess): Promise<void>;
}
