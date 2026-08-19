import type { Task, TaskStatus } from "../../../domain/entities/task.js";
import type { User } from "../../../domain/entities/user.js";

import type { ProjectMemberRepository } from "../../../domain/repositories/project-member-repository.js";
import type { TaskRepository } from "../../../domain/repositories/task-repository.js";

import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";

interface UpdateTaskStatusInput {
  projectId: string;
  taskId: string;
  requesterId: string;
  requesterRole: User["role"];
  status: TaskStatus;
}

export class UpdateTaskStatus {
  constructor(
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(input: UpdateTaskStatusInput): Promise<Task> {
    const requesterProjectRole = await this.projectMemberRepository.findRole(
      input.projectId,
      input.requesterId,
    );

    if (!requesterProjectRole && input.requesterRole !== "admin") {
      throw new NotFoundError("Task not found.");
    }

    const task = await this.taskRepository.findById(input.taskId);

    if (!task || task.projectId !== input.projectId) {
      throw new NotFoundError("Task not found.");
    }

    const canUpdateStatus =
      input.requesterRole === "admin" ||
      requesterProjectRole === "manager" ||
      task.createdByUserId === input.requesterId ||
      task.assignedToUserId === input.requesterId;

    if (!canUpdateStatus) {
      throw new ForbiddenError(
        "Only the task creator, assignee, project managers, and administrators can update the task status.",
      );
    }

    let completedAt: Date | null = null;

    if (input.status === "completed") {
      completedAt =
        task.status === "completed" && task.completedAt
          ? task.completedAt
          : new Date();
    }

    const updatedTask = await this.taskRepository.update(task.id, {
      assignedToUserId: task.assignedToUserId,
      title: task.title,
      description: task.description,
      status: input.status,
      priority: task.priority,
      dueDate: task.dueDate,
      completedAt,
    });

    if (!updatedTask) {
      throw new NotFoundError("Task not found.");
    }

    return updatedTask;
  }
}
