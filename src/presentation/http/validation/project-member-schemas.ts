import { z } from "zod";

export const projectMemberParamsSchema = z.object({
  projectId: z.uuid({ error: "Project ID must be a valid UUID." }),
  userId: z.uuid({ error: "User ID must be a valid UUID." }),
});

export const addProjectMemberBodySchema = z.object({
  userId: z.uuid({ error: "User ID must be a valid UUID." }),
  projectRole: z.enum(["member", "manager"]).default("member"),
});

export type ProjectMemberParams = z.infer<typeof projectMemberParamsSchema>;

export type AddProjectMemberBody = z.infer<typeof addProjectMemberBodySchema>;
