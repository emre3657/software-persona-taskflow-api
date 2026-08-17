import cookieParser from "cookie-parser";

import express, {
  type Express,
  type Request,
  type Response,
  type Router,
} from "express";

import { StatusCodes } from "http-status-codes";

import { httpLogger } from "./infrastructure/logger/http-logger.js";
import { errorHandler } from "./presentation/http/middleware/error-handler.js";
import { notFoundHandler } from "./presentation/http/middleware/not-found-handler.js";

export interface CreateAppOptions {
  authRouter: Router;
}

export function createApp(options: CreateAppOptions): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(httpLogger);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/v1/health", (_request: Request, response: Response): void => {
    response.status(StatusCodes.OK).json({
      data: {
        status: "ok",
      },
    });
  });

  app.use("/api/v1/auth", options.authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
