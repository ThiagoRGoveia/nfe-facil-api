import { Readable, PassThrough } from 'stream';

export abstract class CsvPort {
  abstract convertToCsv(
    data: Record<string, unknown>[],
    options?: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    },
  ): string;

  abstract convertStreamToCsv(
    jsonStream: Readable,
    options?: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    },
  ): PassThrough;
}
