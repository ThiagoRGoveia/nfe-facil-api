export type ProcessStatus = 'SUCCESS' | 'ERROR';

export class DocumentProcessResult {
  private constructor(
    public readonly payload: unknown,
    public readonly status: ProcessStatus,
    public readonly errorCode?: string,
    public readonly errorMessage?: string,
    public readonly warnings?: string[],
    public readonly shouldRetry?: boolean,
    public readonly shouldBillCustomer: boolean = false,
  ) {}

  public static fromSuccess(
    payload: unknown,
    warnings?: string[],
    togetherRequestMade: boolean = false,
  ): DocumentProcessResult {
    return new DocumentProcessResult(payload, 'SUCCESS', undefined, undefined, warnings, false, togetherRequestMade);
  }

  public static fromError(error: {
    code: string;
    message: string;
    data?: unknown;
    shouldRetry?: boolean;
    togetherRequestMade?: boolean;
  }): DocumentProcessResult {
    return new DocumentProcessResult(
      error.data,
      'ERROR',
      error.code,
      error.message,
      undefined,
      error.shouldRetry,
      error.togetherRequestMade || false,
    );
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
