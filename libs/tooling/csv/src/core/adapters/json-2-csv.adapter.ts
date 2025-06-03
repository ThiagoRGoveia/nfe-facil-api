import { Injectable } from '@nestjs/common';
import { json2csv } from 'json-2-csv';
import { CsvPort } from '../ports/csv.port';
import { Readable, Transform } from 'stream';

@Injectable()
export class Json2CsvAdapter implements CsvPort {
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

  convertStreamToCsv(
    jsonStream: Readable,
    options: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    } = {},
  ): Transform {
    let isFirstChunk = true;

    const transformStream = new Transform({
      objectMode: true,
      transform(chunk: Record<string, unknown>, encoding, callback) {
        try {
          const processedData = json2csv([chunk], {
            prependHeader: isFirstChunk,
            excelBOM: false,
            expandNestedObjects: options.expandNestedObjects,
            unwindArrays: options.unwindArrays,
          });

          callback(null, processedData + '\n');
          isFirstChunk = false;
        } catch (error) {
          callback(error);
        }
      },
    });

    jsonStream.pipe(transformStream);

    jsonStream.on('error', (error) => {
      transformStream.emit('error', error);
    });

    return transformStream;
  }
}

export const Json2CsvAdapterProvider = {
  provide: CsvPort,
  useClass: Json2CsvAdapter,
};
