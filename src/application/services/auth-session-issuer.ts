import type { AccessTokenService } from "../ports/access-token-service.js";
import type { RefreshTokenService } from "../ports/refresh-token-service.js";
import type { AuthSession } from "../dtos/auth-session.js";

import type { User } from "../../domain/entities/user.js";
import type { RefreshTokenRepository } from "../../domain/repositories/refresh-token-repository.js";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export class AuthSessionIssuer {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly refreshTokenExpiresInDays: number,
  ) {}

  async issue(user: User): Promise<AuthSession> {
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
