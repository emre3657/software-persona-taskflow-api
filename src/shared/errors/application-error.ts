interface ApplicationErrorOptions {
  statusCode: number;
  code: string;
  type: string;
  title: string;
  detail: string;
}

export class ApplicationError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly type: string;
  readonly title: string;

  constructor(options: ApplicationErrorOptions) {
    super(options.detail);

    this.name = this.constructor.name;
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.type = options.type;
    this.title = options.title;
  }
}
