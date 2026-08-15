import { closeDatabaseConnection, connectToDatabase } from "./sql-server.js";
import { logger } from "../logger/logger.js";
import { runMigrations } from "./migration-runner.js";

async function migrate(): Promise<void> {
  try {
    const pool = await connectToDatabase();

    await runMigrations(pool);

    logger.info("Database migrations completed");
  } catch (error) {
    logger.fatal({ err: error }, "Database migration failed");

    process.exitCode = 1;
  } finally {
    try {
      await closeDatabaseConnection();
    } catch (error) {
      logger.error({ err: error }, "Failed to close database connection");

      process.exitCode = 1;
    }
  }
}

void migrate();
