import type { UserRole } from "../../domain/entities/user.js";

export interface AccessTokenClaims {
  sub: string;
  username: string;
  role: UserRole;
}

export interface AccessTokenService {
  sign(claims: AccessTokenClaims): string;

  verify(token: string): AccessTokenClaims;
}
