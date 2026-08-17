import { StatusCodes } from "http-status-codes";

import { ApplicationError } from "./application-error.js";

export class UnauthenticatedError extends ApplicationError {
  constructor(detail = "Authentication is required.") {
    super({
      statusCode: StatusCodes.UNAUTHORIZED,
      code: "UNAUTHENTICATED",
      type: "urn:taskflow:problem:unauthenticated",
      title: "Authentication failed",
      detail,
    });
  }
}
