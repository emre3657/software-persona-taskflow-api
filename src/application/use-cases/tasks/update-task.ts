import type { Task, TaskPriority } from "../../../domain/entities/task.js";
import type { User } from "../../../domain/entities/user.js";

import type { ProjectMemberRepository } from "../../../domain/repositories/project-member-repository.js";
import type { TaskRepository } from "../../../domain/repositories/task-repository.js";

import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";

interface UpdateTaskInput {
  projectId: string;
  taskId: string;
  requesterId: string;
  requesterRole: User["role"];
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: Date | null;
}

export class UpdateTask {
  constructor(
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(input: UpdateTaskInput): Promise<Task> {
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

    const canUpdate =
      input.requesterRole === "admin" ||
      requesterProjectRole === "manager" ||
      task.createdByUserId === input.requesterId;

    if (!canUpdate) {
      throw new ForbiddenError(
        "Only the task creator, project managers, and administrators can update this task.",
      );
    }

    const updatedTask = await this.taskRepository.update(task.id, {
      assignedToUserId: task.assignedToUserId,
      title: input.title,
      description: input.description,
      status: task.status,
      priority: input.priority,
      dueDate: input.dueDate,
      completedAt: task.completedAt,
    });

    if (!updatedTask) {
      throw new NotFoundError("Task not found.");
    }

    return updatedTask;
  }
}
