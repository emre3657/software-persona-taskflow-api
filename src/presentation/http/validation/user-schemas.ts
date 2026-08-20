import { z } from "zod";

import { USER_ROLES } from "../../../domain/entities/user.js";

import {
  USER_SORT_FIELDS,
  USER_SORT_ORDERS,
} from "../../../domain/repositories/user-repository.js";

import { emailSchema, usernameSchema } from "./user-field-schemas.js";

const userIdSchema = z.guid({
  error: "User ID must be a valid GUID.",
});

const roleQuerySchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    return value
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
  },
  z.array(z.enum(USER_ROLES)).min(1).optional(),
);

const activeStatusQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const updateCurrentUserBodySchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
  })
  .strict();

export const listUsersQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .min(1, "Search must not be empty.")
      .max(254, "Search must not exceed 254 characters.")
      .optional(),

    role: roleQuerySchema,

    isActive: activeStatusQuerySchema,

    sortBy: z.enum(USER_SORT_FIELDS).default("createdAt"),

    sortOrder: z.enum(USER_SORT_ORDERS).default("desc"),

    page: z.coerce
      .number()
      .int("Page must be an integer.")
      .positive("Page must be greater than zero.")
      .default(1),

    pageSize: z.coerce
      .number()
      .int("Page size must be an integer.")
      .min(1, "Page size must be at least 1.")
      .max(100, "Page size must not exceed 100.")
      .default(20),
  })
  .strict();

export const userIdParamsSchema = z
  .object({
    userId: userIdSchema,
  })
  .strict();

export const updateUserStatusBodySchema = z
  .object({
    isActive: z.boolean({
      error: "Active status must be a boolean.",
    }),
  })
  .strict();

export type UpdateCurrentUserBody = z.infer<typeof updateCurrentUserBodySchema>;

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export type UserIdParams = z.infer<typeof userIdParamsSchema>;

export type UpdateUserStatusBody = z.infer<typeof updateUserStatusBodySchema>;
