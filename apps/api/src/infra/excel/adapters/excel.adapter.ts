import { Injectable } from '@nestjs/common';
import { Workbook, stream } from 'exceljs';
import { ExcelPort } from '../ports/excel.port';
import { Readable, PassThrough } from 'stream';

@Injectable()
export class ExcelAdapter implements ExcelPort {
  convertToExcel(
    data: Record<string, unknown>[],
    options: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    } = {},
  ): Promise<Buffer> {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    if (data.length === 0) {
      return workbook.xlsx.writeBuffer() as Promise<Buffer>;
    }

    // Process the data to handle nested objects and arrays if needed
    const processedData = this.processData(data, options);

    // Get headers from the first object
    const headers = Object.keys(processedData[0]);
    worksheet.addRow(headers);

    // Add data rows
    processedData.forEach((item) => {
      const row = headers.map((header) => item[header]);
      worksheet.addRow(row);
    });

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  private processData(
    data: Record<string, unknown>[],
    options: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    },
  ): Record<string, unknown>[] {
    let processedData: Record<string, unknown>[] = [...data];

    if (options.expandNestedObjects || options.unwindArrays) {
      processedData = data.reduce(
        (acc, item) => {
          const flattenedItems = this.flattenObject(item, options);
          return acc.concat(flattenedItems);
        },
        [] as Record<string, unknown>[],
      );
    }

    return processedData;
  }

  private flattenObject(
    obj: Record<string, any>,
    options: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    },
    prefix = '',
  ): Record<string, any>[] {
    const result: Record<string, any>[] = [{}];

    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (Array.isArray(value) && options.unwindArrays) {
        // Handle arrays by creating multiple rows
        const tempResult: Record<string, any>[] = [];
        value.forEach((arrayItem) => {
          if (typeof arrayItem === 'object' && arrayItem !== null) {
            const flattenedArrayItem = this.flattenObject(arrayItem, options, newKey);
            result.forEach((existingItem) => {
              flattenedArrayItem.forEach((newItem) => {
                tempResult.push({ ...existingItem, ...newItem });
              });
            });
          } else {
            result.forEach((existingItem) => {
              tempResult.push({ ...existingItem, [newKey]: arrayItem });
            });
          }
        });
        if (tempResult.length > 0) {
          result.length = 0;
          result.push(...tempResult);
        }
      } else if (typeof value === 'object' && value !== null && options.expandNestedObjects) {
        // Handle nested objects
        const flattenedObject = this.flattenObject(value, options, newKey);
        result.forEach((item) => {
          Object.assign(item, flattenedObject[0]);
        });
      } else {
        // Handle primitive values
        result.forEach((item) => {
          item[newKey] = value;
        });
      }
    }

    return result;
  }

  convertStreamToExcel(
    jsonStream: Readable,
    options: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    } = {},
  ): PassThrough {
    const passThrough = new PassThrough();

    const workbook = new stream.xlsx.WorkbookWriter({
      stream: passThrough,
      useStyles: true,
    });

    const worksheet = workbook.addWorksheet('Sheet1');
    let headersAdded = false;
    let headers: string[] = [];

    jsonStream.on('data', (data: Record<string, unknown>) => {
      // Process the data to handle nested objects and arrays
      const processedItems = this.flattenObject(data, {
        expandNestedObjects: options.expandNestedObjects,
        unwindArrays: options.unwindArrays,
      });

      processedItems.forEach((processedItem) => {
        // Add headers if not added yet
        if (!headersAdded) {
          headers = Object.keys(processedItem);
          worksheet.addRow(headers).commit();
          headersAdded = true;
        }

        // Transform and add the row
        const rowData = headers.map((header) => processedItem[header]);

        worksheet.addRow(rowData).commit();
      });
    });

    jsonStream.on('end', () => {
      worksheet.commit();
      workbook
        .commit()
        .catch((error) => {
          passThrough.emit('error', error);
        })
        .finally(() => {
          passThrough.end();
        });
    });

    jsonStream.on('error', (error) => {
      passThrough.emit('error', error);
    });

    return passThrough;
  }
}
