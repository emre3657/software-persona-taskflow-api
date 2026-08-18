import { createApp } from "./app.js";
import { createCompositionRoot } from "./composition-root.js";
import { env } from "./config/env.js";

import { connectToDatabase } from "./infrastructure/database/sql-server.js";
import { logger } from "./infrastructure/logger/logger.js";

async function startServer(): Promise<void> {
  try {
    const pool = await connectToDatabase();

    const compositionRoot = createCompositionRoot(pool);

    const app = createApp({
      authRouter: compositionRoot.authRouter,
      projectRouter: compositionRoot.projectRouter,
    });

    app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          environment: env.NODE_ENV,
        },
        "HTTP server started",
      );
    });
  } catch (error) {
    logger.fatal({ err: error }, "Application failed to start");

    process.exit(1);
  }
}

void startServer();
