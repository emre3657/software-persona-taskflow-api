export interface GeneratedRefreshToken {
  rawToken: string;
  tokenHash: string;
}

export interface RefreshTokenService {
  generate(): GeneratedRefreshToken;

  generateFamilyId(): string;

  hash(rawToken: string): string;
}
