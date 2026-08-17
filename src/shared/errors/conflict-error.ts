import { StatusCodes } from "http-status-codes";

import { ApplicationError } from "./application-error.js";

export class ConflictError extends ApplicationError {
  constructor(code: string, detail: string) {
    super({
      statusCode: StatusCodes.CONFLICT,
      code,
      type: `urn:taskflow:problem:${code.toLowerCase().replaceAll("_", "-")}`,
      title: "Resource conflict",
      detail,
    });
  }
}
