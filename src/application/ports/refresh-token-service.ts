export interface GeneratedRefreshToken {
  rawToken: string;
  tokenHash: string;
}

export interface RefreshTokenService {
  generate(): GeneratedRefreshToken;

  hash(rawToken: string): string;
}
