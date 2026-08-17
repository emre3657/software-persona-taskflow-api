import * as jwt from "jsonwebtoken";

import type {
  AccessTokenClaims,
  AccessTokenService,
} from "../../application/ports/access-token-service.js";

import { USER_ROLES, type UserRole } from "../../domain/entities/user.js";

function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.some((role) => role === value);
}

export class JwtAccessTokenService implements AccessTokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds = 900,
  ) {}

  sign(claims: AccessTokenClaims): string {
    return jwt.sign(
      {
        username: claims.username,
        role: claims.role,
      },
      this.secret,
      {
        algorithm: "HS256",
        expiresIn: this.expiresInSeconds,
        subject: claims.sub,
      },
    );
  }

  verify(token: string): AccessTokenClaims {
    const payload = jwt.verify(token, this.secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      !isUserRole(payload.role)
    ) {
      throw new Error("Invalid access token payload");
    }

    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
