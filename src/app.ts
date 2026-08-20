import cookieParser from "cookie-parser";

import express, {
  type Express,
  type Request,
  type Response,
  type Router,
} from "express";

import { StatusCodes } from "http-status-codes";

import { createOpenApiRouter } from "./presentation/http/openapi/openapi-router.js";
import { httpLogger } from "./infrastructure/logger/http-logger.js";
import { notFoundHandler } from "./presentation/http/middleware/not-found-handler.js";
import { errorHandler } from "./presentation/http/middleware/error-handler.js";

export interface CreateAppOptions {
  authRouter: Router;
  userRouter: Router;
  projectRouter: Router;
  taskRouter: Router;
}

export function createApp(options: CreateAppOptions): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(httpLogger);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Serve the OpenAPI specification and Swagger UI documentation.
  app.use(createOpenApiRouter());

  app.get("/api/v1/health", (_request: Request, response: Response): void => {
    response.status(StatusCodes.OK).json({
      data: {
        status: "ok",
      },
    });
  });

  app.use("/api/v1/auth", options.authRouter);
  app.use("/api/v1/users", options.userRouter);
  // Express app.use() uses prefix matching, so mount task routes first
  // to avoid running project-level middleware for nested task requests.
  app.use("/api/v1/projects/:projectId/tasks", options.taskRouter);
  app.use("/api/v1/projects", options.projectRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
