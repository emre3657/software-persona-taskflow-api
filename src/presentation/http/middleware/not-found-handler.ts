import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { ApplicationError } from "../../../shared/errors/application-error.js";

export const notFoundHandler: RequestHandler = (req, _res, next): void => {
  next(
    new ApplicationError({
      statusCode: StatusCodes.NOT_FOUND,
      type: "urn:taskflow:problem:route-not-found",
      title: "Route not found",
      detail: `Route ${req.method} ${req.originalUrl} was not found.`,
      code: "ROUTE_NOT_FOUND",
    }),
  );
};
