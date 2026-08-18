import { StatusCodes } from "http-status-codes";
import { ApplicationError } from "./application-error.js";

export class NotFoundError extends ApplicationError {
  constructor(detail: string) {
    super({
      statusCode: StatusCodes.NOT_FOUND,
      code: "RESOURCE_NOT_FOUND",
      type: "urn:taskflow:problem:resource-not-found",
      title: "Resource not found",
      detail,
    });
  }
}
