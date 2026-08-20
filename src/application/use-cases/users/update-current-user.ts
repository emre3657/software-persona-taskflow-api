import type {
  UserListItem,
  UserRepository,
} from "../../../domain/repositories/user-repository.js";

import { ConflictError } from "../../../shared/errors/conflict-error.js";
import { UnauthenticatedError } from "../../../shared/errors/unauthenticated-error.js";

interface UpdateCurrentUserInput {
  userId: string;
  username: string;
  email: string;
}

export class UpdateCurrentUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateCurrentUserInput): Promise<UserListItem> {
    const currentUser = await this.userRepository.findById(input.userId);

    if (!currentUser || !currentUser.isActive) {
      throw new UnauthenticatedError("Authentication is no longer valid.");
    }

    if (input.username !== currentUser.username) {
      const usernameOwner = await this.userRepository.findByUsername(
        input.username,
      );

      if (usernameOwner && usernameOwner.id !== currentUser.id) {
        throw new ConflictError(
          "USERNAME_ALREADY_EXISTS",
          "The username is already in use.",
        );
      }
    }

    if (input.email !== currentUser.email) {
      const emailOwner = await this.userRepository.findByEmail(input.email);

      if (emailOwner && emailOwner.id !== currentUser.id) {
        throw new ConflictError(
          "EMAIL_ALREADY_EXISTS",
          "The email address is already in use.",
        );
      }
    }

    const updatedUser = await this.userRepository.updateProfile(
      currentUser.id,
      {
        username: input.username,
        email: input.email,
      },
    );

    if (!updatedUser) {
      throw new UnauthenticatedError("Authentication is no longer valid.");
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
