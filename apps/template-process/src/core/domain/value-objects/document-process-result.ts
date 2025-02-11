export type ProcessStatus = 'SUCCESS' | 'ERROR' | 'UNDETERMINED_OUTPUT';

export class DocumentProcessResult {
  private constructor(
    public readonly payload: unknown,
    public readonly status: ProcessStatus,
    public readonly errorCode?: string,
    public readonly errorMessage?: string,
    public readonly warnings?: string[],
  ) {}

  public static fromSuccess(payload: unknown, warnings?: string[]): DocumentProcessResult {
    return new DocumentProcessResult(payload, 'SUCCESS', undefined, undefined, warnings);
  }

  public static fromError(error: { code: string; message: string }): DocumentProcessResult {
    return new DocumentProcessResult(null, 'ERROR', error.code, error.message);
  }

  public static fromUndetermined(payload: unknown): DocumentProcessResult {
    return new DocumentProcessResult(payload, 'UNDETERMINED_OUTPUT');
  }

  public isSuccess(): this is IsSuccessResponse {
    return this.status === 'SUCCESS';
  }

  public isError(): this is IsErrorResponse {
    return this.status === 'ERROR';
  }
}

interface IsSuccessResponse extends Omit<DocumentProcessResult, 'isSuccess' | 'payload'> {
  isSuccess: true;
  payload: unknown;
}

interface IsErrorResponse extends Omit<DocumentProcessResult, 'isSuccess' | 'payload' | 'errorCode' | 'errorMessage'> {
  isSuccess: false;
  errorCode: string;
  errorMessage: string;
}
