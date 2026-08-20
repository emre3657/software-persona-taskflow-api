import type { Router } from "express";
import type { ConnectionPool } from "mssql";

import { createAuthModule } from "./composition/auth-module.js";
import { createUserModule } from "./composition/user-module.js";
import { createProjectModule } from "./composition/project-module.js";
import { createTaskModule } from "./composition/task-module.js";

export interface CompositionRoot {
  authRouter: Router;
  userRouter: Router;
  projectRouter: Router;
  taskRouter: Router;
}

export function createCompositionRoot(pool: ConnectionPool): CompositionRoot {
  const authModule = createAuthModule(pool);

  const projectModule = createProjectModule(pool, authModule.authenticate);

  const taskModule = createTaskModule(pool, authModule.authenticate);

  const userModule = createUserModule(pool, authModule.authenticate);

  return {
    authRouter: authModule.router,
    userRouter: userModule.router,
    projectRouter: projectModule.router,
    taskRouter: taskModule.router,
  };
}
