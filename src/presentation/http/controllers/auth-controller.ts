import type { RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

import type { AuthSession } from "../../../application/dtos/auth-session.js";
import type { LoginUser } from "../../../application/use-cases/auth/login-user.js";
import type { LogoutAllSessions } from "../../../application/use-cases/auth/logout-all-sessions.js";
import type { LogoutUser } from "../../../application/use-cases/auth/logout-user.js";
import type { RefreshSession } from "../../../application/use-cases/auth/refresh-session.js";
import type { RegisterUser } from "../../../application/use-cases/auth/register-user.js";

import { UnauthenticatedError } from "../../../shared/errors/unauthenticated-error.js";

import {
  clearRefreshTokenCookie,
  getRefreshTokenCookie,
  setRefreshTokenCookie,
  type RefreshTokenCookieConfig,
} from "../cookies/refresh-token-cookie.js";

import {
  loginBodySchema,
  registerBodySchema,
} from "../validation/auth-schemas.js";

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser,
    private readonly refreshSession: RefreshSession,
    private readonly logoutUser: LogoutUser,
    private readonly logoutAllSessions: LogoutAllSessions,
    private readonly cookieConfig: RefreshTokenCookieConfig,
  ) {}

  private sendAuthSession(
    res: Response,
    statusCode: number,
    session: AuthSession,
  ): void {
    setRefreshTokenCookie(res, session.refreshToken, this.cookieConfig);

    res.status(statusCode).json({
      data: {
        user: session.user,
        accessToken: session.accessToken,
      },
    });
  }

  readonly register: RequestHandler = async (req, res): Promise<void> => {
    const body = registerBodySchema.parse(req.body);

    const session = await this.registerUser.execute(body);

    this.sendAuthSession(res, StatusCodes.CREATED, session);
  };

  readonly login: RequestHandler = async (req, res): Promise<void> => {
    const body = loginBodySchema.parse(req.body);

    const session = await this.loginUser.execute(body);

    this.sendAuthSession(res, StatusCodes.OK, session);
  };

  readonly refresh: RequestHandler = async (req, res): Promise<void> => {
    try {
      const rawRefreshToken = getRefreshTokenCookie(req);

      if (!rawRefreshToken) {
        throw new UnauthenticatedError("Refresh token is required.");
      }

      const session = await this.refreshSession.execute(rawRefreshToken);

      this.sendAuthSession(res, StatusCodes.OK, session);
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        clearRefreshTokenCookie(res, this.cookieConfig.secure);
      }

      throw error;
    }
  };

  readonly logout: RequestHandler = async (req, res): Promise<void> => {
    const rawRefreshToken = getRefreshTokenCookie(req);

    await this.logoutUser.execute(rawRefreshToken);

    clearRefreshTokenCookie(res, this.cookieConfig.secure);

    res.status(StatusCodes.NO_CONTENT).send();
  };

  readonly logoutAll: RequestHandler = async (req, res): Promise<void> => {
    if (!req.user) {
      throw new UnauthenticatedError();
    }

    await this.logoutAllSessions.execute(req.user.id);

    clearRefreshTokenCookie(res, this.cookieConfig.secure);

    res.status(StatusCodes.NO_CONTENT).send();
  };
}
