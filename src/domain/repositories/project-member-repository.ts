import type { ProjectMember, ProjectRole } from "../entities/project-member.js";

export interface ProjectMemberDetails extends ProjectMember {
  username: string;
  email: string;
}

export interface AddProjectMemberData {
  projectId: string;
  userId: string;
  projectRole: ProjectRole;
}

export interface ProjectMemberRepository {
  findRole(projectId: string, userId: string): Promise<ProjectRole | null>;

  findAll(projectId: string): Promise<ProjectMemberDetails[]>;

  add(data: AddProjectMemberData): Promise<ProjectMember>;

  remove(projectId: string, userId: string): Promise<boolean>;

  countManagers(projectId: string): Promise<number>;
}
