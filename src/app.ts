import express, { type Express, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";
import { httpLogger } from "./infrastructure/logger/http-logger.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(httpLogger);
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/v1/health", (_req: Request, res: Response): void => {
    res.status(StatusCodes.OK).json({
      data: {
        status: "ok",
      },
    });
  });

  return app;
}
