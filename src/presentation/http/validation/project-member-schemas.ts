import { z } from "zod";

export const projectMemberParamsSchema = z.object({
  projectId: z.guid({ error: "Project ID must be a valid UUID." }),
  userId: z.guid({ error: "User ID must be a valid UUID." }),
});

export const addProjectMemberBodySchema = z.object({
  userId: z.guid({ error: "User ID must be a valid UUID." }),
  projectRole: z.enum(["member", "manager"]).default("member"),
});

export type ProjectMemberParams = z.infer<typeof projectMemberParamsSchema>;

export type AddProjectMemberBody = z.infer<typeof addProjectMemberBodySchema>;
