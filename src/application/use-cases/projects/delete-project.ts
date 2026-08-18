import type { User } from "../../../domain/entities/user.js";
import type { ProjectRepository } from "../../../domain/repositories/project-repository.js";
import type { UserRepository } from "../../../domain/repositories/user-repository.js";
import type { PasswordHasher } from "../../ports/password-hasher.js";
import { ConflictError } from "../../../shared/errors/conflict-error.js";
import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";
import { UnauthenticatedError } from "../../../shared/errors/unauthenticated-error.js";

interface DeleteProjectInput {
  projectId: string;
  userId: string;
  userRole: User["role"];
  password: string;
}

export class DeleteProject {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: DeleteProjectInput): Promise<void> {
    const projectForUser = await this.projectRepository.findByIdForUser(
      input.projectId,
      input.userId,
    );

    if (projectForUser) {
      const canDelete =
        input.userRole === "admin" ||
        projectForUser.currentUserRole === "manager";

      if (!canDelete) {
        throw new ForbiddenError(
          "Only project managers and administrators can delete this project.",
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

    const user = await this.userRepository.findById(input.userId);

    if (!user || !user.isActive) {
      throw new UnauthenticatedError("Authentication is no longer valid.");
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthenticatedError("The password is incorrect.");
    }

    const hasTasks = await this.projectRepository.hasTasks(input.projectId);

    if (hasTasks) {
      throw new ConflictError(
        "PROJECT_HAS_TASKS",
        "Project cannot be deleted while it contains tasks.",
      );
    }

    const deleted = await this.projectRepository.delete(input.projectId);

    if (!deleted) {
      throw new NotFoundError("Project not found.");
    }
  }
}
