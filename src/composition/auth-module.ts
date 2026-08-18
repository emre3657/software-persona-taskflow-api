import type { RequestHandler, Router } from "express";

import type { ConnectionPool } from "mssql";

import { env } from "../config/env.js";

import { AuthSessionIssuer } from "../application/services/auth-session-issuer.js";

import { LoginUser } from "../application/use-cases/auth/login-user.js";
import { LogoutAllSessions } from "../application/use-cases/auth/logout-all-sessions.js";
import { LogoutUser } from "../application/use-cases/auth/logout-user.js";
import { RefreshSession } from "../application/use-cases/auth/refresh-session.js";
import { RegisterUser } from "../application/use-cases/auth/register-user.js";

import { SqlServerUserRepository } from "../infrastructure/repositories/sql-server-user-repository.js";
import { SqlServerRegistrationRepository } from "../infrastructure/repositories/sql-server-registration-repository.js";
import { SqlServerRefreshTokenRepository } from "../infrastructure/repositories/sql-server-refresh-token-repository.js";

import { BcryptPasswordHasher } from "../infrastructure/security/bcrypt-password-hasher.js";
import { CryptoRefreshTokenService } from "../infrastructure/security/crypto-refresh-token-service.js";
import { JwtAccessTokenService } from "../infrastructure/security/jwt-access-token-service.js";

import { AuthController } from "../presentation/http/controllers/auth-controller.js";
import { createAuthenticateMiddleware } from "../presentation/http/middleware/authenticate.js";
import { createAuthRouter } from "../presentation/http/routes/auth-routes.js";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface AuthModule {
  router: Router;
  authenticate: RequestHandler;
}

export function createAuthModule(pool: ConnectionPool): AuthModule {
  const userRepository = new SqlServerUserRepository(pool);

  const registrationRepository = new SqlServerRegistrationRepository(pool);

  const refreshTokenRepository = new SqlServerRefreshTokenRepository(pool);

  const passwordHasher = new BcryptPasswordHasher(env.BCRYPT_SALT_ROUNDS);

  const accessTokenService = new JwtAccessTokenService(
    env.JWT_ACCESS_SECRET,
    env.JWT_ACCESS_EXPIRES_IN_SECONDS,
  );

  const refreshTokenService = new CryptoRefreshTokenService();

  const authSessionIssuer = new AuthSessionIssuer(
    refreshTokenRepository,
    accessTokenService,
    refreshTokenService,
    env.REFRESH_TOKEN_EXPIRES_IN_DAYS,
  );

  const registerUser = new RegisterUser(
    userRepository,
    registrationRepository,
    passwordHasher,
    accessTokenService,
    refreshTokenService,
    env.REFRESH_TOKEN_EXPIRES_IN_DAYS,
  );

  const loginUser = new LoginUser(
    userRepository,
    passwordHasher,
    authSessionIssuer,
  );

  const refreshSession = new RefreshSession(
    userRepository,
    refreshTokenRepository,
    accessTokenService,
    refreshTokenService,
    env.REFRESH_TOKEN_EXPIRES_IN_DAYS,
  );

  const logoutUser = new LogoutUser(
    refreshTokenRepository,
    refreshTokenService,
  );

  const logoutAllSessions = new LogoutAllSessions(refreshTokenRepository);

  const cookieConfig = {
    secure: env.NODE_ENV === "production",
    maxAgeInMilliseconds:
      env.REFRESH_TOKEN_EXPIRES_IN_DAYS * MILLISECONDS_PER_DAY,
  };

  const authController = new AuthController(
    registerUser,
    loginUser,
    refreshSession,
    logoutUser,
    logoutAllSessions,
    cookieConfig,
  );

  const authenticate = createAuthenticateMiddleware(accessTokenService);

  const router = createAuthRouter(authController, authenticate);

  return {
    router,
    authenticate,
  };
}
