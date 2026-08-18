import { StatusCodes } from "http-status-codes";
import { ApplicationError } from "./application-error.js";

export class ForbiddenError extends ApplicationError {
  constructor(detail = "You do not have permission to perform this action.") {
    super({
      statusCode: StatusCodes.FORBIDDEN,
      code: "FORBIDDEN",
      type: "urn:taskflow:problem:forbidden",
      title: "Forbidden",
      detail,
    });
  }
}
