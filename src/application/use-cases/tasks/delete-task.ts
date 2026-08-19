import type { User } from "../../../domain/entities/user.js";

import type { ProjectMemberRepository } from "../../../domain/repositories/project-member-repository.js";
import type { TaskRepository } from "../../../domain/repositories/task-repository.js";

import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";

interface DeleteTaskInput {
  projectId: string;
  taskId: string;
  requesterId: string;
  requesterRole: User["role"];
}

export class DeleteTask {
  constructor(
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(input: DeleteTaskInput): Promise<void> {
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

    const canDelete =
      input.requesterRole === "admin" || requesterProjectRole === "manager";

    if (!canDelete) {
      throw new ForbiddenError(
        "Only project managers and administrators can delete tasks.",
      );
    }

    const deleted = await this.taskRepository.delete(task.id);

    if (!deleted) {
      throw new NotFoundError("Task not found.");
    }
  }
}
