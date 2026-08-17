import type { AccessTokenService } from "../../ports/access-token-service.js";
import type { PasswordHasher } from "../../ports/password-hasher.js";
import type { RefreshTokenService } from "../../ports/refresh-token-service.js";
import type { AuthSession } from "../../dtos/auth-session.js";

import type { RefreshTokenRepository } from "../../../domain/repositories/refresh-token-repository.js";
import type { UserRepository } from "../../../domain/repositories/user-repository.js";

import { ConflictError } from "../../../shared/errors/conflict-error.js";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
}

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly refreshTokenExpiresInDays: number,
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

    const generatedRefreshToken = this.refreshTokenService.generate();

    const tokenFamilyId = this.refreshTokenService.generateFamilyId();

    const expiresAt = new Date(
      Date.now() + this.refreshTokenExpiresInDays * MILLISECONDS_PER_DAY,
    );

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenFamilyId,
      tokenHash: generatedRefreshToken.tokenHash,
      expiresAt,
    });

    const accessToken = this.accessTokenService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken: generatedRefreshToken.rawToken,
    };
  }
}
