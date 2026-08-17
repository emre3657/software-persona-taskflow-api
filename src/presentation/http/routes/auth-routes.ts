import { Router, type RequestHandler } from "express";

import type { AuthController } from "../controllers/auth-controller.js";

export function createAuthRouter(
  authController: AuthController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.post("/register", authController.register);

  router.post("/login", authController.login);

  router.post("/refresh", authController.refresh);

  router.post("/logout", authController.logout);

  router.post("/logout-all", authenticate, authController.logoutAll);

  return router;
}
