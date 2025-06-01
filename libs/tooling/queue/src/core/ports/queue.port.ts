export type FifoOptions = {
  fifo?: boolean;
  groupId?: string;
};

export abstract class QueuePort {
  abstract sendMessage<T>(queue: string, message: T, options?: FifoOptions): Promise<void>;
}
