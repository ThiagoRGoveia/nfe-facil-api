export abstract class CsvConverterPort {
  abstract convertToCsv(
    data: Record<string, unknown>[],
    options: {
      expandNestedObjects?: boolean;
      unwindArrays?: boolean;
    },
  ): string;
}
