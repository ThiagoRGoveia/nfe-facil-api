import { Injectable } from '@nestjs/common';
import { Readable, PassThrough } from 'stream';

@Injectable()
export abstract class ExcelPort {
  abstract convertToExcel(
    data: Record<string, unknown>[],
    options?: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    },
  ): Promise<Buffer>;

  abstract convertStreamToExcel(
    jsonStream: Readable,
    options?: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    },
  ): PassThrough;
}
