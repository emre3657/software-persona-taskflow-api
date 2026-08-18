import type {
  ProjectMember,
  ProjectRole,
} from "../../../domain/entities/project-member.js";
import type { User } from "../../../domain/entities/user.js";
import type { ProjectRepository } from "../../../domain/repositories/project-repository.js";
import type { ProjectMemberRepository } from "../../../domain/repositories/project-member-repository.js";
import type { UserRepository } from "../../../domain/repositories/user-repository.js";
import { ConflictError } from "../../../shared/errors/conflict-error.js";
import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";

interface AddProjectMemberInput {
  projectId: string;
  requesterId: string;
  requesterRole: User["role"];
  userId: string;
  projectRole: ProjectRole;
}

export class AddProjectMember {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: AddProjectMemberInput): Promise<ProjectMember> {
    const requesterProjectRole = await this.projectMemberRepository.findRole(
      input.projectId,
      input.requesterId,
    );

    if (!requesterProjectRole) {
      if (input.requesterRole !== "admin") {
        throw new NotFoundError("Project not found.");
      }

      const project = await this.projectRepository.findById(input.projectId);

      if (!project) {
        throw new NotFoundError("Project not found.");
      }
    } else if (
      requesterProjectRole !== "manager" &&
      input.requesterRole !== "admin"
    ) {
      throw new ForbiddenError(
        "Only project managers and administrators can add project members.",
      );
    }

    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (!user.isActive) {
      throw new ConflictError(
        "USER_INACTIVE",
        "An inactive user cannot be added to a project.",
      );
    }

    const existingRole = await this.projectMemberRepository.findRole(
      input.projectId,
      input.userId,
    );

    if (existingRole) {
      throw new ConflictError(
        "PROJECT_MEMBER_ALREADY_EXISTS",
        "The user is already a member of this project.",
      );
    }

    return this.projectMemberRepository.add({
      projectId: input.projectId,
      userId: input.userId,
      projectRole: input.projectRole,
    });
  }
}
