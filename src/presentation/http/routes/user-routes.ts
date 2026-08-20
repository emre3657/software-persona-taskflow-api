import { Router, type RequestHandler } from "express";

import type { UserController } from "../controllers/user-controller.js";

export function createUserRouter(
  userController: UserController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);

  router.get("/", userController.list);

  router
    .route("/me")
    .get(userController.getCurrent)
    .put(userController.updateCurrent);

  router.patch("/:userId/status", userController.updateStatus);

  return router;
}
