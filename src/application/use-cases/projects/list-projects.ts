import type {
  ProjectRepository,
  ProjectWithRole,
} from "../../../domain/repositories/project-repository.js";

interface ListProjectsInput {
  userId: string;
}

export class ListProjects {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: ListProjectsInput): Promise<ProjectWithRole[]> {
    return this.projectRepository.findAllForUser(input.userId);
  }
}
