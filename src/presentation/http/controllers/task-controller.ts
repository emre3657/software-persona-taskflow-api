import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

import type { AssignTask } from "../../../application/use-cases/tasks/assign-task.js";
import type { CreateTask } from "../../../application/use-cases/tasks/create-task.js";
import type { DeleteTask } from "../../../application/use-cases/tasks/delete-task.js";
import type { GetTask } from "../../../application/use-cases/tasks/get-task.js";
import type { ListTasks } from "../../../application/use-cases/tasks/list-tasks.js";
import type { UpdateTask } from "../../../application/use-cases/tasks/update-task.js";
import type { UpdateTaskStatus } from "../../../application/use-cases/tasks/update-task-status.js";

import { projectIdParamsSchema } from "../validation/project-schemas.js";

import {
  assignTaskBodySchema,
  createTaskBodySchema,
  taskParamsSchema,
  updateTaskBodySchema,
  updateTaskStatusBodySchema,
} from "../validation/task-schemas.js";

import { taskQuerySchema } from "../validation/task-query-schema.js";

export class TaskController {
  constructor(
    private readonly createTask: CreateTask,
    private readonly listTasks: ListTasks,
    private readonly getTask: GetTask,
    private readonly updateTask: UpdateTask,
    private readonly assignTask: AssignTask,
    private readonly updateTaskStatus: UpdateTaskStatus,
    private readonly deleteTask: DeleteTask,
  ) {}

  readonly create: RequestHandler = async (req, res): Promise<void> => {
    const params = projectIdParamsSchema.parse(req.params);
    const body = createTaskBodySchema.parse(req.body);

    const task = await this.createTask.execute({
      projectId: params.projectId,
      requesterId: req.user!.id,
      requesterRole: req.user!.role,
      assignedToUserId: body.assignedToUserId ?? null,
      title: body.title,
      description: body.description ?? null,
      priority: body.priority,
      dueDate: body.dueDate ?? null,
    });

    res.status(StatusCodes.CREATED).json({
      data: task,
    });
  };

  readonly list: RequestHandler = async (req, res): Promise<void> => {
    const params = projectIdParamsSchema.parse(req.params);
    const query = taskQuerySchema.parse(req.query);

    const result = await this.listTasks.execute({
      projectId: params.projectId,
      requesterId: req.user!.id,
      requesterRole: req.user!.role,

      search: query.search,

      statuses: query.status,
      priorities: query.priority,

      assignedToUserId: query.assignedToUserId,
      createdByUserId: query.createdByUserId,

      unassigned: query.unassigned,
      overdue: query.overdue,

      dueDateFrom: query.dueDateFrom,
      dueDateTo: query.dueDateTo,

      createdAtFrom: query.createdAtFrom,
      createdAtTo: query.createdAtTo,

      updatedAtFrom: query.updatedAtFrom,
      updatedAtTo: query.updatedAtTo,

      completedAtFrom: query.completedAtFrom,
      completedAtTo: query.completedAtTo,

      sorts: query.sort,

      page: query.page,
      pageSize: query.pageSize,
    });

    res.status(StatusCodes.OK).json({
      data: result.tasks,
      meta: result.pagination,
    });
  };

  readonly getById: RequestHandler = async (req, res): Promise<void> => {
    const params = taskParamsSchema.parse(req.params);

    const task = await this.getTask.execute({
      projectId: params.projectId,
      taskId: params.taskId,
      requesterId: req.user!.id,
      requesterRole: req.user!.role,
    });

    res.status(StatusCodes.OK).json({
      data: task,
    });
  };

  readonly update: RequestHandler = async (req, res): Promise<void> => {
    const params = taskParamsSchema.parse(req.params);
    const body = updateTaskBodySchema.parse(req.body);

    const task = await this.updateTask.execute({
      projectId: params.projectId,
      taskId: params.taskId,
      requesterId: req.user!.id,
      requesterRole: req.user!.role,
      title: body.title,
      description: body.description,
      priority: body.priority,
      dueDate: body.dueDate,
    });

    res.status(StatusCodes.OK).json({
      data: task,
    });
  };

  readonly assign: RequestHandler = async (req, res): Promise<void> => {
    const params = taskParamsSchema.parse(req.params);
    const body = assignTaskBodySchema.parse(req.body);

    const task = await this.assignTask.execute({
      projectId: params.projectId,
      taskId: params.taskId,
      requesterId: req.user!.id,
      requesterRole: req.user!.role,
      assignedToUserId: body.assignedToUserId,
    });

    res.status(StatusCodes.OK).json({
      data: task,
    });
  };

  readonly updateStatus: RequestHandler = async (req, res): Promise<void> => {
    const params = taskParamsSchema.parse(req.params);
    const body = updateTaskStatusBodySchema.parse(req.body);

    const task = await this.updateTaskStatus.execute({
      projectId: params.projectId,
      taskId: params.taskId,
      requesterId: req.user!.id,
      requesterRole: req.user!.role,
      status: body.status,
    });

    res.status(StatusCodes.OK).json({
      data: task,
    });
  };

  readonly delete: RequestHandler = async (req, res): Promise<void> => {
    const params = taskParamsSchema.parse(req.params);

    await this.deleteTask.execute({
      projectId: params.projectId,
      taskId: params.taskId,
      requesterId: req.user!.id,
      requesterRole: req.user!.role,
    });

    res.status(StatusCodes.NO_CONTENT).send();
  };
}
