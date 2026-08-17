import type { AuthSession } from "../../dtos/auth-session.js";
import type { PasswordHasher } from "../../ports/password-hasher.js";

import type { AuthSessionIssuer } from "../../services/auth-session-issuer.js";

import type { UserRepository } from "../../../domain/repositories/user-repository.js";

import { UnauthenticatedError } from "../../../shared/errors/unauthenticated-error.js";

export interface LoginUserInput {
  identifier: string;
  password: string;
}

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly authSessionIssuer: AuthSessionIssuer,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthSession> {
    const identifier = input.identifier.trim();

    const user = await this.userRepository.findByIdentifier(identifier);

    if (!user) {
      throw new UnauthenticatedError("Invalid username/email or password.");
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches || !user.isActive) {
      throw new UnauthenticatedError("Invalid username/email or password.");
    }

    return this.authSessionIssuer.issue(user);
  }
}
