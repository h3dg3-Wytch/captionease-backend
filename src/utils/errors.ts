interface IExtendedError {
  message: string,
  context?: Record<string, any>,
  error?: Error,
  statusCode?: number,
  expose?: boolean,
  errorCode?: string,
}

export class ExtendedError extends Error {
  public context: any;
  public originalError?: Error;
  public statusCode?: number;
  public errorCode?: string;
  public expose: boolean;

  constructor({
    message = 'Unknown Error',
    context,
    error,
    statusCode,
    expose = false,
    errorCode,
  }: IExtendedError) {
    super(message);
    this.name = this.constructor.name;

    this.expose = expose; // Encode

    // Free form context information
    this.context = context;

    // Original error if there is one
    this.originalError = error;

    // For throwing errors through the api-gateway
    this.statusCode = statusCode;

    // Error code to allow clients to react accordingly
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }

  public toString() {
    const cause = this.originalError || '';
    const originalExtendedError = cause instanceof ExtendedError;

    return `${this.stack}

      ${this.context ? `\nContext:\n${JSON.stringify(this.context, null, 2)}` : ''}

      ${cause && `\n\nOriginal Error:\n${originalExtendedError ? cause.toString() : cause.stack}`}
    `;
  }
}

export class LambdaError extends ExtendedError {
  public event?: any;

  constructor({
    event,
    ...rest
  }: {
    event: any,
  } & IExtendedError) {
    super({ ...rest, expose: true });
    this.event = event;
  }
}
