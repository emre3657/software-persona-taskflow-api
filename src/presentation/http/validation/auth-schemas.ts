import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .refine(
    (password) => Buffer.byteLength(password, "utf8") <= 72,
    "Password must not exceed 72 bytes.",
  );

export const registerBodySchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must contain at least 3 characters.")
    .max(50, "Username must not exceed 50 characters.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username contains invalid characters."),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z
        .email({
          error: "Enter a valid email address.",
        })
        .max(254, "Email must be at most 254 characters."),
    ),

  password: passwordSchema,
});

export const loginBodySchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Username or email is required.")
    .max(254, "Username or email must not exceed 254 characters."),

  password: z
    .string()
    .min(1, "Password is required.")
    .refine(
      (password) => Buffer.byteLength(password, "utf8") <= 72,
      "Password must not exceed 72 bytes.",
    ),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

export type LoginBody = z.infer<typeof loginBodySchema>;
