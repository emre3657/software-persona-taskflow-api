import { z } from "zod";

import {
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "../../../domain/entities/task.js";

import {
  TASK_SORT_FIELDS,
  TASK_SORT_ORDERS,
} from "../../../domain/repositories/task-repository.js";

function splitCommaSeparated(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSorts(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separatorIndex = item.lastIndexOf("_");

      if (separatorIndex === -1) {
        return {
          field: item,
          order: "",
        };
      }

      return {
        field: item.slice(0, separatorIndex),
        order: item.slice(separatorIndex + 1),
      };
    });
}

const booleanQuerySchema = z
  .enum(["true", "false"], {
    error: "Value must be true or false.",
  })
  .transform((value) => value === "true");

const statusListSchema = z.preprocess(
  splitCommaSeparated,
  z
    .array(z.enum(TASK_STATUSES))
    .min(1, "At least one status is required.")
    .transform((values) => [...new Set(values)]),
);

const priorityListSchema = z.preprocess(
  splitCommaSeparated,
  z
    .array(z.enum(TASK_PRIORITIES))
    .min(1, "At least one priority is required.")
    .transform((values) => [...new Set(values)]),
);

const isoDateValueSchema = z.union([
  z.iso.datetime({
    offset: true,
    error: "Enter a valid ISO date or date and time.",
  }),
  z.iso.date({
    error: "Enter a valid ISO date or date and time.",
  }),
]);

const rangeStartSchema = isoDateValueSchema.transform((value) => {
  if (value.length === 10) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  return new Date(value);
});

const rangeEndSchema = isoDateValueSchema.transform((value) => {
  if (value.length === 10) {
    return new Date(`${value}T23:59:59.999Z`);
  }

  return new Date(value);
});

const taskSortSchema = z.object({
  field: z.enum(TASK_SORT_FIELDS),
  order: z.enum(TASK_SORT_ORDERS),
});

const taskSortListSchema = z
  .preprocess(
    parseSorts,
    z
      .array(taskSortSchema)
      .min(1, "At least one sort is required.")
      .max(3, "At most three sort fields are allowed.")
      .superRefine((sorts, ctx) => {
        const fields = new Set<string>();

        sorts.forEach((sort, index) => {
          if (fields.has(sort.field)) {
            ctx.addIssue({
              code: "custom",
              path: [index],
              message: "Each sort field can only be used once.",
            });
          }

          fields.add(sort.field);
        });
      }),
  )
  .default([
    {
      field: "createdAt",
      order: "desc",
    },
  ]);

export const taskQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .min(1, "Search cannot be empty.")
      .max(200, "Search must be at most 200 characters.")
      .optional(),

    status: statusListSchema.optional(),
    priority: priorityListSchema.optional(),

    assignedToUserId: z
      .guid({
        error: "Assigned user ID must be a valid GUID.",
      })
      .optional(),

    createdByUserId: z
      .guid({
        error: "Creator user ID must be a valid GUID.",
      })
      .optional(),

    unassigned: booleanQuerySchema.optional(),
    overdue: booleanQuerySchema.optional(),

    dueDateFrom: rangeStartSchema.optional(),
    dueDateTo: rangeEndSchema.optional(),

    createdAtFrom: rangeStartSchema.optional(),
    createdAtTo: rangeEndSchema.optional(),

    updatedAtFrom: rangeStartSchema.optional(),
    updatedAtTo: rangeEndSchema.optional(),

    completedAtFrom: rangeStartSchema.optional(),
    completedAtTo: rangeEndSchema.optional(),

    sort: taskSortListSchema,

    page: z.coerce.number().int().positive().default(1),

    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .superRefine((query, ctx) => {
    if (query.unassigned === true && query.assignedToUserId) {
      ctx.addIssue({
        code: "custom",
        path: ["unassigned"],
        message: "Unassigned cannot be true when assignedToUserId is provided.",
      });
    }

    if (
      query.dueDateFrom &&
      query.dueDateTo &&
      query.dueDateFrom > query.dueDateTo
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDateTo"],
        message: "Due date end must not be before the start.",
      });
    }

    if (
      query.createdAtFrom &&
      query.createdAtTo &&
      query.createdAtFrom > query.createdAtTo
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["createdAtTo"],
        message: "Created date end must not be before the start.",
      });
    }

    if (
      query.updatedAtFrom &&
      query.updatedAtTo &&
      query.updatedAtFrom > query.updatedAtTo
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["updatedAtTo"],
        message: "Updated date end must not be before the start.",
      });
    }

    if (
      query.completedAtFrom &&
      query.completedAtTo &&
      query.completedAtFrom > query.completedAtTo
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["completedAtTo"],
        message: "Completed date end must not be before the start.",
      });
    }
  });

export type TaskQuery = z.infer<typeof taskQuerySchema>;
