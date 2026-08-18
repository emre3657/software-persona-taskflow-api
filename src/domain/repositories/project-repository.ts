import type { Project } from "../entities/project.js";
import type { ProjectRole } from "../entities/project-member.js";

export interface CreateProjectData {
  name: string;
  description: string | null;
  createdByUserId: string;
}

export interface UpdateProjectData {
  name: string;
  description: string | null;
}

export interface ProjectWithRole extends Project {
  currentUserRole: ProjectRole;
}

export interface ProjectRepository {
  createWithManager(data: CreateProjectData): Promise<Project>;

  findById(id: string): Promise<Project | null>;

  findByIdForUser(
    projectId: string,
    userId: string,
  ): Promise<ProjectWithRole | null>;

  findAllForUser(userId: string): Promise<ProjectWithRole[]>;

  update(id: string, data: UpdateProjectData): Promise<Project | null>;

  delete(id: string): Promise<boolean>;

  hasTasks(id: string): Promise<boolean>;
}
