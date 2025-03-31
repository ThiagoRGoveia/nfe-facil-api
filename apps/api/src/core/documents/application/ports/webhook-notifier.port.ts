import { BatchProcess } from '../../domain/entities/batch-process.entity';
import { FileRecord } from '../../domain/entities/file-records.entity';
import { WebhookEvent } from '../dtos/webhook-events.dto';

export abstract class WebhookNotifierPort {
  /**
   * Webhook event type constants
   */
  static readonly DOCUMENT_PROCESSED_EVENT: WebhookEvent = WebhookEvent.DOCUMENT_PROCESSED;
  static readonly DOCUMENT_FAILED_EVENT: WebhookEvent = WebhookEvent.DOCUMENT_FAILED;
  static readonly BATCH_FINISHED_EVENT: WebhookEvent = WebhookEvent.BATCH_FINISHED;

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
