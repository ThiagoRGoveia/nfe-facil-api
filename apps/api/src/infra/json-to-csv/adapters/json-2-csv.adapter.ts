import { Injectable } from '@nestjs/common';
import { json2csv } from 'json-2-csv';
import { CsvConverterPort } from '../ports/csv-converter.port';

@Injectable()
export class Json2CsvAdapter implements CsvConverterPort {
  convertToCsv(
    data: Record<string, unknown>[],
    options: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    } = {},
  ): string {
    return json2csv(data, {
      prependHeader: true,
      excelBOM: false,
      expandNestedObjects: options.expandNestedObjects,
      unwindArrays: options.unwindArrays,
    });
  }
}
