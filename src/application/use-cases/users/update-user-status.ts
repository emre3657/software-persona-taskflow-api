import type {
  UserListItem,
  UserRepository,
} from "../../../domain/repositories/user-repository.js";

import { ConflictError } from "../../../shared/errors/conflict-error.js";
import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";
import { UnauthenticatedError } from "../../../shared/errors/unauthenticated-error.js";

interface UpdateUserStatusInput {
  requesterId: string;
  userId: string;
  isActive: boolean;
}

export class UpdateUserStatus {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserStatusInput): Promise<UserListItem> {
    const requester = await this.userRepository.findById(input.requesterId);

    if (!requester || !requester.isActive) {
      throw new UnauthenticatedError("Authentication is no longer valid.");
    }

    if (requester.role !== "admin") {
      throw new ForbiddenError("Only administrators can update user status.");
    }

    const targetUser = await this.userRepository.findById(input.userId);

    if (!targetUser) {
      throw new NotFoundError("User not found.");
    }

    if (targetUser.id === requester.id && input.isActive === false) {
      throw new ConflictError(
        "ADMIN_CANNOT_DEACTIVATE_SELF",
        "Administrators cannot deactivate their own account.",
      );
    }

    if (targetUser.isActive === input.isActive) {
      return {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt,
      };
    }

    const updatedUser = await this.userRepository.updateActiveStatus(
      targetUser.id,
      input.isActive,
    );

    if (!updatedUser) {
      throw new NotFoundError("User not found.");
    }

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
