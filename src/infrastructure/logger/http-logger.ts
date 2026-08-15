import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";
import { logger } from "./logger.js";

export const httpLogger = pinoHttp({
  logger,

  genReqId(req, res) {
    const incomingRequestId = req.headers["x-request-id"];

    const requestId =
      typeof incomingRequestId === "string" &&
      incomingRequestId.trim().length > 0
        ? incomingRequestId
        : randomUUID();

    res.setHeader("x-request-id", requestId);

    return requestId;
  },

  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },

    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },

  customLogLevel(_req, res, error) {
    if (error || res.statusCode >= 500) {
      return "error";
    }

    if (res.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },
});
