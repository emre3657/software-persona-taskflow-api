import type { Project } from "../../../domain/entities/project.js";
import type { User } from "../../../domain/entities/user.js";
import type { ProjectRepository } from "../../../domain/repositories/project-repository.js";
import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";

interface UpdateProjectInput {
  projectId: string;
  userId: string;
  userRole: User["role"];
  name: string;
  description: string | null;
}

export class UpdateProject {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: UpdateProjectInput): Promise<Project> {
    const projectForUser = await this.projectRepository.findByIdForUser(
      input.projectId,
      input.userId,
    );

    if (projectForUser) {
      const canUpdate =
        input.userRole === "admin" ||
        projectForUser.currentUserRole === "manager";

      if (!canUpdate) {
        throw new ForbiddenError(
          "Only project managers and administrators can update this project.",
        );
      }
    } else {
      if (input.userRole !== "admin") {
        throw new NotFoundError("Project not found.");
      }

      const project = await this.projectRepository.findById(input.projectId);

      if (!project) {
        throw new NotFoundError("Project not found.");
      }
    }

    const updatedProject = await this.projectRepository.update(
      input.projectId,
      {
        name: input.name,
        description: input.description,
      },
    );

    if (!updatedProject) {
      throw new NotFoundError("Project not found.");
    }

    return updatedProject;
  }
}
