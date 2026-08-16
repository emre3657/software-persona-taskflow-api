export const REFRESH_TOKEN_REVOKE_REASONS = [
  "rotated",
  "logout",
  "expired",
  "reuse_detected",
] as const;

export type RefreshTokenRevokeReason =
  (typeof REFRESH_TOKEN_REVOKE_REASONS)[number];

export interface RefreshToken {
  id: string;
  userId: string;
  tokenFamilyId: string;
  tokenHash: string;
  replacedByTokenId: string | null;
  revokedAt: Date | null;
  revokeReason: RefreshTokenRevokeReason | null;
  expiresAt: Date;
  createdAt: Date;
}
