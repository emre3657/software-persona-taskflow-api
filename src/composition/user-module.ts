import type { RequestHandler, Router } from "express";

import type { ConnectionPool } from "mssql";

import { GetCurrentUser } from "../application/use-cases/users/get-current-user.js";
import { ListUsers } from "../application/use-cases/users/list-users.js";
import { UpdateCurrentUser } from "../application/use-cases/users/update-current-user.js";
import { UpdateUserStatus } from "../application/use-cases/users/update-user-status.js";

import { SqlServerUserRepository } from "../infrastructure/repositories/sql-server-user-repository.js";

import { UserController } from "../presentation/http/controllers/user-controller.js";
import { createUserRouter } from "../presentation/http/routes/user-routes.js";

export interface UserModule {
  router: Router;
}

export function createUserModule(
  pool: ConnectionPool,
  authenticate: RequestHandler,
): UserModule {
  const userRepository = new SqlServerUserRepository(pool);

  const getCurrentUser = new GetCurrentUser(userRepository);

  const updateCurrentUser = new UpdateCurrentUser(userRepository);

  const listUsers = new ListUsers(userRepository);

  const updateUserStatus = new UpdateUserStatus(userRepository);

  const userController = new UserController(
    getCurrentUser,
    updateCurrentUser,
    listUsers,
    updateUserStatus,
  );

  const router = createUserRouter(userController, authenticate);

  return {
    router,
  };
}
