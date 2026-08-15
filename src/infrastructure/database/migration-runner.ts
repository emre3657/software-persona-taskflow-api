import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mssql, { type ConnectionPool } from "mssql";
import { logger } from "../logger/logger.js";

interface AppliedMigration {
  MigrationName: string;
}

const migrationsDirectory = path.resolve(
  process.cwd(),
  "src",
  "infrastructure",
  "database",
  "migrations",
);

async function ensureMigrationTable(pool: ConnectionPool): Promise<void> {
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.SchemaMigrations
      (
        Id INT IDENTITY(1, 1) NOT NULL,
        MigrationName NVARCHAR(255) NOT NULL,
        AppliedAt DATETIME2(3) NOT NULL
          CONSTRAINT DF_SchemaMigrations_AppliedAt
          DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_SchemaMigrations
          PRIMARY KEY CLUSTERED (Id),

        CONSTRAINT UQ_SchemaMigrations_MigrationName
          UNIQUE (MigrationName)
      );
    END;
  `);
}

async function getAppliedMigrations(
  pool: ConnectionPool,
): Promise<Set<string>> {
  const result = await pool.request().query<AppliedMigration>(`
    SELECT MigrationName
    FROM dbo.SchemaMigrations;
  `);

  return new Set(result.recordset.map((migration) => migration.MigrationName));
}

export async function runMigrations(pool: ConnectionPool): Promise<void> {
  await ensureMigrationTable(pool);

  const appliedMigrations = await getAppliedMigrations(pool);

  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((fileName) => /^\d{3}_[a-z0-9_]+\.sql$/.test(fileName))
    .sort();

  for (const migrationFile of migrationFiles) {
    if (appliedMigrations.has(migrationFile)) {
      continue;
    }

    const migrationPath = path.join(migrationsDirectory, migrationFile);

    const migrationSql = await readFile(migrationPath, "utf8");
    const transaction = new mssql.Transaction(pool);

    await transaction.begin();

    try {
      await new mssql.Request(transaction).batch(migrationSql);

      await new mssql.Request(transaction).input(
        "migrationName",
        mssql.NVarChar(255),
        migrationFile,
      ).query(`
          INSERT INTO dbo.SchemaMigrations (MigrationName)
          VALUES (@migrationName);
        `);

      await transaction.commit();

      logger.info({ migration: migrationFile }, "Database migration applied");
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        logger.error(
          { err: rollbackError, migration: migrationFile },
          "Migration rollback failed",
        );
      }

      throw error;
    }
  }
}
