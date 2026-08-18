import type { Project } from "../../../domain/entities/project.js";
import type { ProjectRole } from "../../../domain/entities/project-member.js";
import type { User } from "../../../domain/entities/user.js";
import type { ProjectRepository } from "../../../domain/repositories/project-repository.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";

export interface ProjectDetails extends Project {
  currentUserRole: ProjectRole | null;
}

interface GetProjectInput {
  projectId: string;
  userId: string;
  userRole: User["role"];
}

export class GetProject {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: GetProjectInput): Promise<ProjectDetails> {
    const projectForUser = await this.projectRepository.findByIdForUser(
      input.projectId,
      input.userId,
    );

    if (projectForUser) {
      return projectForUser;
    }

    if (input.userRole !== "admin") {
      throw new NotFoundError("Project not found.");
    }

    const project = await this.projectRepository.findById(input.projectId);

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    return {
      ...project,
      currentUserRole: null,
    };
  }
}
