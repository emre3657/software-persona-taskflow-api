import type { RefreshTokenRepository } from "../../../domain/repositories/refresh-token-repository.js";

export class LogoutAllSessions {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeActiveByUser(userId, "logout");
  }
}
