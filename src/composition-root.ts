import type { Router } from "express";
import type { ConnectionPool } from "mssql";

import { createAuthModule } from "./composition/auth-module.js";

export interface CompositionRoot {
  authRouter: Router;
}

export function createCompositionRoot(pool: ConnectionPool): CompositionRoot {
  const authModule = createAuthModule(pool);

  return {
    authRouter: authModule.router,
  };
}
