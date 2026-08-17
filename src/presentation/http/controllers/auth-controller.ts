import type { Request, Response } from "express";

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
    response: Response,
    statusCode: number,
    session: AuthSession,
  ): void {
    setRefreshTokenCookie(response, session.refreshToken, this.cookieConfig);

    response.status(statusCode).json({
      data: {
        user: session.user,
        accessToken: session.accessToken,
      },
    });
  }

  register = async (request: Request, response: Response): Promise<void> => {
    const body = registerBodySchema.parse(request.body);

    const session = await this.registerUser.execute(body);

    this.sendAuthSession(response, StatusCodes.CREATED, session);
  };

  login = async (request: Request, response: Response): Promise<void> => {
    const body = loginBodySchema.parse(request.body);

    const session = await this.loginUser.execute(body);

    this.sendAuthSession(response, StatusCodes.OK, session);
  };

  refresh = async (request: Request, response: Response): Promise<void> => {
    try {
      const rawRefreshToken = getRefreshTokenCookie(request);

      if (!rawRefreshToken) {
        throw new UnauthenticatedError("Refresh token is required.");
      }

      const session = await this.refreshSession.execute(rawRefreshToken);

      this.sendAuthSession(response, StatusCodes.OK, session);
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        clearRefreshTokenCookie(response, this.cookieConfig.secure);
      }

      throw error;
    }
  };

  logout = async (request: Request, response: Response): Promise<void> => {
    const rawRefreshToken = getRefreshTokenCookie(request);

    await this.logoutUser.execute(rawRefreshToken);

    clearRefreshTokenCookie(response, this.cookieConfig.secure);

    response.status(StatusCodes.NO_CONTENT).send();
  };

  logoutAll = async (request: Request, response: Response): Promise<void> => {
    if (!request.user) {
      throw new UnauthenticatedError();
    }

    await this.logoutAllSessions.execute(request.user.id);

    clearRefreshTokenCookie(response, this.cookieConfig.secure);

    response.status(StatusCodes.NO_CONTENT).send();
  };
}
