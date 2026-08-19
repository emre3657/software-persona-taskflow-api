import type { RequestHandler, Router } from "express";
import type { ConnectionPool } from "mssql";

import { AssignTask } from "../application/use-cases/tasks/assign-task.js";
import { CreateTask } from "../application/use-cases/tasks/create-task.js";
import { DeleteTask } from "../application/use-cases/tasks/delete-task.js";
import { GetTask } from "../application/use-cases/tasks/get-task.js";
import { ListTasks } from "../application/use-cases/tasks/list-tasks.js";
import { UpdateTask } from "../application/use-cases/tasks/update-task.js";
import { UpdateTaskStatus } from "../application/use-cases/tasks/update-task-status.js";

import { SqlServerProjectMemberRepository } from "../infrastructure/repositories/sql-server-project-member-repository.js";
import { SqlServerProjectRepository } from "../infrastructure/repositories/sql-server-project-repository.js";
import { SqlServerTaskRepository } from "../infrastructure/repositories/sql-server-task-repository.js";
import { SqlServerUserRepository } from "../infrastructure/repositories/sql-server-user-repository.js";

import { TaskController } from "../presentation/http/controllers/task-controller.js";
import { createTaskRouter } from "../presentation/http/routes/task-routes.js";

export interface TaskModule {
  router: Router;
}

export function createTaskModule(
  pool: ConnectionPool,
  authenticate: RequestHandler,
): TaskModule {
  const projectRepository = new SqlServerProjectRepository(pool);

  const projectMemberRepository = new SqlServerProjectMemberRepository(pool);

  const taskRepository = new SqlServerTaskRepository(pool);

  const userRepository = new SqlServerUserRepository(pool);

  const createTask = new CreateTask(
    projectRepository,
    projectMemberRepository,
    taskRepository,
    userRepository,
  );

  const listTasks = new ListTasks(
    projectRepository,
    projectMemberRepository,
    taskRepository,
  );

  const getTask = new GetTask(
    projectRepository,
    projectMemberRepository,
    taskRepository,
  );

  const updateTask = new UpdateTask(projectMemberRepository, taskRepository);

  const assignTask = new AssignTask(
    projectMemberRepository,
    taskRepository,
    userRepository,
  );

  const updateTaskStatus = new UpdateTaskStatus(
    projectMemberRepository,
    taskRepository,
  );

  const deleteTask = new DeleteTask(projectMemberRepository, taskRepository);

  const taskController = new TaskController(
    createTask,
    listTasks,
    getTask,
    updateTask,
    assignTask,
    updateTaskStatus,
    deleteTask,
  );

  const router = createTaskRouter(taskController, authenticate);

  return {
    router,
  };
}
