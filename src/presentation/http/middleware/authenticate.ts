import type { RequestHandler } from "express";

import type { AccessTokenService } from "../../../application/ports/access-token-service.js";

import { UnauthenticatedError } from "../../../shared/errors/unauthenticated-error.js";

export function createAuthenticateMiddleware(
  accessTokenService: AccessTokenService,
): RequestHandler {
  return (request, _response, next): void => {
    const authorization = request.get("authorization");

    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    const accessToken = match?.[1];

    if (!accessToken) {
      throw new UnauthenticatedError(
        "A valid Bearer access token is required.",
      );
    }

    try {
      const claims = accessTokenService.verify(accessToken);

      request.user = {
        id: claims.sub,
        username: claims.username,
        role: claims.role,
      };
    } catch {
      throw new UnauthenticatedError("The access token is invalid or expired.");
    }

    next();
  };
}
