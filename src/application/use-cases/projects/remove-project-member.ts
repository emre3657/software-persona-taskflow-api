import type { User } from "../../../domain/entities/user.js";
import type { ProjectRepository } from "../../../domain/repositories/project-repository.js";
import type { ProjectMemberRepository } from "../../../domain/repositories/project-member-repository.js";
import { ConflictError } from "../../../shared/errors/conflict-error.js";
import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";

interface RemoveProjectMemberInput {
  projectId: string;
  requesterId: string;
  requesterRole: User["role"];
  userId: string;
}

export class RemoveProjectMember {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
  ) {}

  async execute(input: RemoveProjectMemberInput): Promise<void> {
    const requesterProjectRole = await this.projectMemberRepository.findRole(
      input.projectId,
      input.requesterId,
    );

    if (!requesterProjectRole && input.requesterRole !== "admin") {
      throw new NotFoundError("Project not found.");
    }

    if (
      requesterProjectRole &&
      requesterProjectRole !== "manager" &&
      input.requesterRole !== "admin"
    ) {
      throw new ForbiddenError(
        "Only project managers and administrators can remove project members.",
      );
    }

    const project = await this.projectRepository.findById(input.projectId);

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    const memberRole = await this.projectMemberRepository.findRole(
      input.projectId,
      input.userId,
    );

    if (!memberRole) {
      throw new NotFoundError("Project member not found.");
    }

    if (project.createdByUserId === input.userId) {
      throw new ConflictError(
        "PROJECT_CREATOR_CANNOT_BE_REMOVED",
        "The project creator cannot be removed from the project.",
      );
    }

    const hasAssignedTasks =
      await this.projectMemberRepository.hasAssignedTasks(
        input.projectId,
        input.userId,
      );

    if (hasAssignedTasks) {
      throw new ConflictError(
        "PROJECT_MEMBER_HAS_ASSIGNED_TASKS",
        "The project member cannot be removed while they have assigned tasks.",
      );
    }

    if (memberRole === "manager") {
      const managerCount = await this.projectMemberRepository.countManagers(
        input.projectId,
      );

      if (managerCount <= 1) {
        throw new ConflictError(
          "PROJECT_REQUIRES_MANAGER",
          "The last project manager cannot be removed.",
        );
      }
    }

    const removed = await this.projectMemberRepository.remove(
      input.projectId,
      input.userId,
    );

    if (!removed) {
      throw new NotFoundError("Project member not found.");
    }
  }
}
