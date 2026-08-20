import { Router } from "express";

import swaggerUi from "swagger-ui-express";

import { openApiDocument } from "./openapi-document.js";

export function createOpenApiRouter(): Router {
  const router = Router();

  router.get("/openapi.json", (_req, res) => {
    res.json(openApiDocument);
  });

  router.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "TaskFlow API Documentation",

      swaggerOptions: {
        displayRequestDuration: true,
      },
    }),
  );

  return router;
}
