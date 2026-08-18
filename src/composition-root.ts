import type { Router } from "express";
import type { ConnectionPool } from "mssql";

import { createAuthModule } from "./composition/auth-module.js";
import { createProjectModule } from "./composition/project-module.js";

export interface CompositionRoot {
  authRouter: Router;
  projectRouter: Router;
}

export function createCompositionRoot(pool: ConnectionPool): CompositionRoot {
  const authModule = createAuthModule(pool);

  const projectModule = createProjectModule(pool, authModule.authenticate);

  return {
    authRouter: authModule.router,
    projectRouter: projectModule.router,
  };
}
