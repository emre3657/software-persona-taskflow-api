import { Router, type RequestHandler } from "express";

import type { TaskController } from "../controllers/task-controller.js";

export function createTaskRouter(
  taskController: TaskController,
  authenticate: RequestHandler,
): Router {
  const router = Router({
    mergeParams: true,
  });

  router.use(authenticate);

  // prettier-ignore
  router
    .route("/")
    .post(taskController.create)
    .get(taskController.list);

  router
    .route("/:taskId")
    .get(taskController.getById)
    .put(taskController.update)
    .delete(taskController.delete);

  // prettier-ignore
  router
    .route("/:taskId/assignee")
    .patch(taskController.assign);

  // prettier-ignore
  router
    .route("/:taskId/status")
    .patch(taskController.updateStatus);

  return router;
}
