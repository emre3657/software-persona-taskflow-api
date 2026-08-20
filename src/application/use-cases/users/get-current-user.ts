import type {
  UserListItem,
  UserRepository,
} from "../../../domain/repositories/user-repository.js";

import { UnauthenticatedError } from "../../../shared/errors/unauthenticated-error.js";

interface GetCurrentUserInput {
  userId: string;
}

export class GetCurrentUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetCurrentUserInput): Promise<UserListItem> {
    const user = await this.userRepository.findById(input.userId);

    if (!user || !user.isActive) {
      throw new UnauthenticatedError("Authentication is no longer valid.");
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
