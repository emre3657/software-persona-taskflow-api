import type { PasswordHasher } from "../../ports/password-hasher.js";
import type { AuthSession } from "../../dtos/auth-session.js";

import type { UserRepository } from "../../../domain/repositories/user-repository.js";
import type { AuthSessionIssuer } from "../../services/auth-session-issuer.js";

import { ConflictError } from "../../../shared/errors/conflict-error.js";

export interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
}

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly authSessionIssuer: AuthSessionIssuer,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthSession> {
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();

    const [existingUsername, existingEmail] = await Promise.all([
      this.userRepository.findByUsername(username),
      this.userRepository.findByEmail(email),
    ]);

    if (existingUsername) {
      throw new ConflictError(
        "USERNAME_ALREADY_EXISTS",
        "The username is already in use.",
      );
    }

    if (existingEmail) {
      throw new ConflictError(
        "EMAIL_ALREADY_EXISTS",
        "The email address is already in use.",
      );
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepository.create({
      username,
      email,
      passwordHash,
      role: "user",
    });

    return this.authSessionIssuer.issue(user);
  }
}
