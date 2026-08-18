import type { User } from "../../../domain/entities/user.js";
import type { ProjectRepository } from "../../../domain/repositories/project-repository.js";
import type {
  ProjectMemberDetails,
  ProjectMemberRepository,
} from "../../../domain/repositories/project-member-repository.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";

interface ListProjectMembersInput {
  projectId: string;
  userId: string;
  userRole: User["role"];
}

export class ListProjectMembers {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
  ) {}

  async execute(
    input: ListProjectMembersInput,
  ): Promise<ProjectMemberDetails[]> {
    const currentUserRole = await this.projectMemberRepository.findRole(
      input.projectId,
      input.userId,
    );

    if (!currentUserRole) {
      if (input.userRole !== "admin") {
        throw new NotFoundError("Project not found.");
      }

      const project = await this.projectRepository.findById(input.projectId);

      if (!project) {
        throw new NotFoundError("Project not found.");
      }
    }

    return this.projectMemberRepository.findAll(input.projectId);
  }
}
