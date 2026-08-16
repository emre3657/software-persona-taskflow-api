export const PROJECT_ROLES = ["manager", "member"] as const;

export type ProjectRole = (typeof PROJECT_ROLES)[number];

export interface ProjectMember {
  projectId: string;
  userId: string;
  projectRole: ProjectRole;
  joinedAt: Date;
}
