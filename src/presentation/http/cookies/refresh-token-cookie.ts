import type { CookieOptions, Response } from "express";

export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

const REFRESH_TOKEN_COOKIE_PATH = "/api/v1/auth";

export interface RefreshTokenCookieConfig {
  secure: boolean;
  maxAgeInMilliseconds: number;
}

function createBaseCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: REFRESH_TOKEN_COOKIE_PATH,
  };
}

export function setRefreshTokenCookie(
  response: Response,
  refreshToken: string,
  config: RefreshTokenCookieConfig,
): void {
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...createBaseCookieOptions(config.secure),
    maxAge: config.maxAgeInMilliseconds,
  });
}

export function clearRefreshTokenCookie(
  response: Response,
  secure: boolean,
): void {
  response.clearCookie(
    REFRESH_TOKEN_COOKIE_NAME,
    createBaseCookieOptions(secure),
  );
}
