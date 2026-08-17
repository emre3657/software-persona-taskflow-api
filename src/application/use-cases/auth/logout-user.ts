import type { RefreshTokenService } from "../../ports/refresh-token-service.js";

import type { RefreshTokenRepository } from "../../../domain/repositories/refresh-token-repository.js";

export class LogoutUser {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async execute(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }

    const tokenHash = this.refreshTokenService.hash(rawRefreshToken);

    const refreshToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!refreshToken || refreshToken.revokedAt) {
      return;
    }

    await this.refreshTokenRepository.revokeById(refreshToken.id, "logout");
  }
}
