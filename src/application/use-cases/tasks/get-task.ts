import type { Task } from "../../../domain/entities/task.js";
import type { User } from "../../../domain/entities/user.js";

import type { ProjectRepository } from "../../../domain/repositories/project-repository.js";
import type { ProjectMemberRepository } from "../../../domain/repositories/project-member-repository.js";
import type { TaskRepository } from "../../../domain/repositories/task-repository.js";

import { NotFoundError } from "../../../shared/errors/not-found-error.js";

interface GetTaskInput {
  projectId: string;
  taskId: string;
  requesterId: string;
  requesterRole: User["role"];
}

export class GetTask {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(input: GetTaskInput): Promise<Task> {
    const requesterProjectRole = await this.projectMemberRepository.findRole(
      input.projectId,
      input.requesterId,
    );

    if (!requesterProjectRole && input.requesterRole !== "admin") {
      throw new NotFoundError("Task not found.");
    }

    if (!requesterProjectRole) {
      const project = await this.projectRepository.findById(input.projectId);

      if (!project) {
        throw new NotFoundError("Task not found.");
      }
    }

    const task = await this.taskRepository.findById(input.taskId);

    if (!task || task.projectId !== input.projectId) {
      throw new NotFoundError("Task not found.");
    }

    return task;
  }
}
