import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class ExcelPort {
  abstract convertToExcel(
    data: Record<string, unknown>[],
    options?: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    },
  ): Promise<Buffer>;
}
