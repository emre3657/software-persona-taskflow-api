import type { Project } from "../../../domain/entities/project.js";
import type { ProjectRepository } from "../../../domain/repositories/project-repository.js";

interface CreateProjectInput {
  userId: string;
  name: string;
  description?: string | null;
}

export class CreateProject {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    return this.projectRepository.createWithManager({
      name: input.name,
      description: input.description ?? null,
      createdByUserId: input.userId,
    });
  }
}
