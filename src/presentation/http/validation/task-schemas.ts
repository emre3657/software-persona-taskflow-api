import { z } from "zod";

import {
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "../../../domain/entities/task.js";

const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "Task title is required.")
  .max(200, "Task title must be at most 200 characters.");

const taskDescriptionSchema = z
  .string()
  .trim()
  .max(2_000, "Task description must be at most 2000 characters.")
  .nullable();

const dateTimeSchema = z.iso
  .datetime({
    offset: true,
    error: "Enter a valid ISO 8601 date and time.",
  })
  .transform((value) => new Date(value));

export const taskParamsSchema = z.object({
  projectId: z.guid({
    error: "Project ID must be a valid GUID.",
  }),
  taskId: z.guid({
    error: "Task ID must be a valid GUID.",
  }),
});

export const createTaskBodySchema = z.object({
  title: taskTitleSchema,

  description: taskDescriptionSchema.optional(),

  priority: z.enum(TASK_PRIORITIES).default("medium"),

  assignedToUserId: z
    .guid({
      error: "Assigned user ID must be a valid GUID.",
    })
    .nullable()
    .optional(),

  dueDate: dateTimeSchema.nullable().optional(),
});

export const updateTaskBodySchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema,
  priority: z.enum(TASK_PRIORITIES),
  dueDate: dateTimeSchema.nullable(),
});

export const assignTaskBodySchema = z.object({
  assignedToUserId: z
    .guid({
      error: "Assigned user ID must be a valid GUID.",
    })
    .nullable(),
});

export const updateTaskStatusBodySchema = z.object({
  status: z.enum(TASK_STATUSES),
});

export type TaskParams = z.infer<typeof taskParamsSchema>;

export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;

export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;

export type AssignTaskBody = z.infer<typeof assignTaskBodySchema>;

export type UpdateTaskStatusBody = z.infer<typeof updateTaskStatusBodySchema>;
