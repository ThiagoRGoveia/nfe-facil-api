import { DocumentProcess } from '../../domain/entities/document-process.entity';

export abstract class WebhookNotifierPort {
  /**
   * Sends a success notification to the configured webhook URL
   * @param process The completed document process
   */
  abstract notifySuccess(process: DocumentProcess): Promise<void>;

  /**
   * Sends a failure notification to the configured webhook URL
   * @param process The failed document process
   */
  abstract notifyFailure(process: DocumentProcess): Promise<void>;
}
