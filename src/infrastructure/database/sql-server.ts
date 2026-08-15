import mssql from "mssql";
import type { config as SqlConfig, ConnectionPool } from "mssql";
import { env } from "../../config/env.js";
import { logger } from "../logger/logger.js";

const sqlConfig: SqlConfig = {
  server: env.DB_SERVER,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,

  options: {
    encrypt: env.DB_ENCRYPT,
    trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
  },

  pool: {
    min: 0,
    max: 10,
    idleTimeoutMillis: 30_000,
  },
};

let pool: ConnectionPool | undefined;

export async function connectToDatabase(): Promise<ConnectionPool> {
  if (pool?.connected) {
    return pool;
  }

  pool = await new mssql.ConnectionPool(sqlConfig).connect();

  logger.info(
    {
      server: env.DB_SERVER,
      port: env.DB_PORT,
      database: env.DB_NAME,
    },
    "Connected to SQL Server",
  );

  return pool;
}

export async function closeDatabaseConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = undefined;
  }
}
