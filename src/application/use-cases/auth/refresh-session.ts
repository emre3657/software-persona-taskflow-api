import type { AuthSession } from "../../dtos/auth-session.js";
import type { AccessTokenService } from "../../ports/access-token-service.js";
import type { RefreshTokenService } from "../../ports/refresh-token-service.js";

import type { RefreshTokenRepository } from "../../../domain/repositories/refresh-token-repository.js";
import type { UserRepository } from "../../../domain/repositories/user-repository.js";

import { UnauthenticatedError } from "../../../shared/errors/unauthenticated-error.js";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export class RefreshSession {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly refreshTokenExpiresInDays: number,
  ) {}

  async execute(rawRefreshToken: string): Promise<AuthSession> {
    const tokenHash = this.refreshTokenService.hash(rawRefreshToken);

    const currentToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!currentToken) {
      throw new UnauthenticatedError("Invalid refresh token.");
    }

    if (currentToken.revokedAt) {
      await this.refreshTokenRepository.revokeActiveByFamily(
        currentToken.tokenFamilyId,
        "reuse_detected",
      );

      throw new UnauthenticatedError("Invalid refresh token.");
    }

    if (currentToken.expiresAt <= new Date()) {
      await this.refreshTokenRepository.revokeById(currentToken.id, "expired");

      throw new UnauthenticatedError("Invalid refresh token.");
    }

    const user = await this.userRepository.findById(currentToken.userId);

    if (!user || !user.isActive) {
      await this.refreshTokenRepository.revokeActiveByFamily(
        currentToken.tokenFamilyId,
        "logout",
      );

      throw new UnauthenticatedError("Invalid refresh token.");
    }

    const accessToken = this.accessTokenService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    const generatedRefreshToken = this.refreshTokenService.generate();

    const expiresAt = new Date(
      Date.now() + this.refreshTokenExpiresInDays * MILLISECONDS_PER_DAY,
    );

    const rotatedToken = await this.refreshTokenRepository.rotate(
      currentToken.id,
      {
        tokenHash: generatedRefreshToken.tokenHash,
        expiresAt,
      },
    );

    if (!rotatedToken) {
      await this.refreshTokenRepository.revokeActiveByFamily(
        currentToken.tokenFamilyId,
        "reuse_detected",
      );

      throw new UnauthenticatedError("Invalid refresh token.");
    }

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
