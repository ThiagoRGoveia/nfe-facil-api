export abstract class QueuePort {
  abstract sendMessage<T>(queue: string, message: T): Promise<void>;
}
