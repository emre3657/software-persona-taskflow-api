import type {
  RefreshToken,
  RefreshTokenRevokeReason,
} from "../entities/refresh-token.js";

export interface CreateRefreshTokenData {
  userId: string;
  tokenFamilyId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface RotateRefreshTokenData {
  tokenHash: string;
  expiresAt: Date;
}

export type RefreshTokenInvalidationReason = Exclude<
  RefreshTokenRevokeReason,
  "rotated"
>;

export interface RefreshTokenRepository {
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;

  create(data: CreateRefreshTokenData): Promise<RefreshToken>;

  rotate(
    currentTokenId: string,
    data: RotateRefreshTokenData,
  ): Promise<RefreshToken | null>;

  revokeById(
    id: string,
    reason: RefreshTokenInvalidationReason,
  ): Promise<boolean>;

  revokeActiveByFamily(
    tokenFamilyId: string,
    reason: RefreshTokenInvalidationReason,
  ): Promise<number>;

  revokeActiveByUser(
    userId: string,
    reason: RefreshTokenInvalidationReason,
  ): Promise<number>;
}
