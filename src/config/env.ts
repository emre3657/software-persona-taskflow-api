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

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(900),

  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
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
