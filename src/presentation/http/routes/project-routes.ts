import { Router, type RequestHandler } from "express";

import type { ProjectController } from "../controllers/project-controller.js";
import type { ProjectMemberController } from "../controllers/project-member-controller.js";

export function createProjectRouter(
  projectController: ProjectController,
  projectMemberController: ProjectMemberController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);

  // prettier-ignore
  router
    .route("/")
    .post(projectController.create)
    .get(projectController.list);

  router
    .route("/:projectId")
    .get(projectController.getById)
    .put(projectController.update)
    .delete(projectController.delete);

  router
    .route("/:projectId/members")
    .get(projectMemberController.list)
    .post(projectMemberController.add);

  router
    .route("/:projectId/members/:userId")
    .delete(projectMemberController.remove);

  return router;
}
