import { z } from "zod";

const projectNameSchema = z
  .string()
  .trim()
  .min(1, "Project name is required.")
  .max(200, "Project name must be at most 200 characters.");

const projectDescriptionSchema = z
  .string()
  .trim()
  .max(2_000, "Project description must be at most 2000 characters.")
  .nullable();

export const projectIdParamsSchema = z.object({
  projectId: z.uuid({
    error: "Project ID must be a valid UUID.",
  }),
});

export const createProjectBodySchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema.optional(),
});

export const updateProjectBodySchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema,
});

export const deleteProjectBodySchema = z.object({
  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password must be at most 128 characters."),
});

export type ProjectIdParams = z.infer<typeof projectIdParamsSchema>;
export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
export type DeleteProjectBody = z.infer<typeof deleteProjectBodySchema>;
