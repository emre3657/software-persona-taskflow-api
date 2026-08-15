import type { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { ApplicationError } from "../../../shared/errors/application-error.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  _next,
): void => {
  if (error instanceof ZodError) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .set("Content-Type", "application/problem+json")
      .json({
        type: "urn:taskflow:problem:validation-error",
        title: "Validation failed",
        status: StatusCodes.BAD_REQUEST,
        detail: "The request contains invalid fields.",
        instance: req.originalUrl,
        code: "VALIDATION_ERROR",
        requestId: req.id,
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });

    return;
  }

  if (error instanceof ApplicationError) {
    res
      .status(error.statusCode)
      .set("Content-Type", "application/problem+json")
      .json({
        type: error.type,
        title: error.title,
        status: error.statusCode,
        detail: error.message,
        instance: req.originalUrl,
        code: error.code,
        requestId: req.id,
      });

    return;
  }

  req.log.error({ err: error }, "Unhandled request error");

  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .set("Content-Type", "application/problem+json")
    .json({
      type: "urn:taskflow:problem:internal-server-error",
      title: "Internal server error",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      detail: "An unexpected error occurred.",
      instance: req.originalUrl,
      code: "INTERNAL_SERVER_ERROR",
      requestId: req.id,
    });
};
