export type ProcessStatus = 'SUCCESS' | 'ERROR';

export class DocumentProcessResult {
  private constructor(
    public readonly payload: unknown,
    public readonly status: ProcessStatus,
    public readonly errorCode?: string,
    public readonly errorMessage?: string,
  ) {}

  public static fromSuccess(payload: unknown): DocumentProcessResult {
    return new DocumentProcessResult(payload, 'SUCCESS');
  }

  public static fromError(error: { code: string; message: string }): DocumentProcessResult {
    return new DocumentProcessResult(null, 'ERROR', error.code, error.message);
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
