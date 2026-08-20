import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must contain at least 3 characters.")
  .max(50, "Username must not exceed 50 characters.")
  .regex(/^[a-zA-Z0-9._-]+$/, "Username contains invalid characters.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email({
        error: "Enter a valid email address.",
      })
      .max(254, "Email must be at most 254 characters."),
  );
