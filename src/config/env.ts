import "dotenv/config";
import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().max(65_535).default(3000),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("debug"),

  DB_SERVER: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().max(65_535),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_ENCRYPT: booleanString,
  DB_TRUST_SERVER_CERTIFICATE: booleanString,
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errors = result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  console.error("Invalid environment variables:", errors);
  throw new Error("Invalid environment configuration.");
}

export const env = result.data;
