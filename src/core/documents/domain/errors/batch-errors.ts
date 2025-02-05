export class BatchOperationForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BatchOperationForbiddenError';
  }
}

export class BatchNotFoundError extends Error {
  constructor(id: string) {
    super(`Batch with ID ${id} not found`);
    this.name = 'BatchNotFoundError';
  }
}

export class FileNotFoundError extends Error {
  constructor(id: string) {
    super(`File with ID ${id} not found`);
    this.name = 'FileNotFoundError';
  }
}
