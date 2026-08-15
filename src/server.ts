import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./infrastructure/logger/logger.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      environment: env.NODE_ENV,
    },
    "HTTP server started",
  );
});
