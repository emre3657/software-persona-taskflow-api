import type { Task, TaskPriority } from "../../../domain/entities/task.js";
import type { User } from "../../../domain/entities/user.js";

import type { ProjectRepository } from "../../../domain/repositories/project-repository.js";
import type { ProjectMemberRepository } from "../../../domain/repositories/project-member-repository.js";
import type { TaskRepository } from "../../../domain/repositories/task-repository.js";
import type { UserRepository } from "../../../domain/repositories/user-repository.js";

import { ConflictError } from "../../../shared/errors/conflict-error.js";
import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";

interface CreateTaskInput {
  projectId: string;
  requesterId: string;
  requesterRole: User["role"];
  assignedToUserId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: Date | null;
}

export class CreateTask {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly taskRepository: TaskRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const requesterProjectRole = await this.projectMemberRepository.findRole(
      input.projectId,
      input.requesterId,
    );

    if (!requesterProjectRole) {
      if (input.requesterRole !== "admin") {
        throw new NotFoundError("Project not found.");
      }

      const project = await this.projectRepository.findById(input.projectId);

      if (!project) {
        throw new NotFoundError("Project not found.");
      }
    }

    const canAssignOtherMembers =
      input.requesterRole === "admin" || requesterProjectRole === "manager";

    if (
      input.assignedToUserId &&
      input.assignedToUserId !== input.requesterId &&
      !canAssignOtherMembers
    ) {
      throw new ForbiddenError(
        "Only project managers and administrators can assign tasks to other members.",
      );
    }

    if (input.assignedToUserId) {
      const assigneeProjectRole = await this.projectMemberRepository.findRole(
        input.projectId,
        input.assignedToUserId,
      );

      if (!assigneeProjectRole) {
        throw new ConflictError(
          "ASSIGNEE_NOT_PROJECT_MEMBER",
          "The assigned user must be a member of the project.",
        );
      }

      const assignee = await this.userRepository.findById(
        input.assignedToUserId,
      );

      if (!assignee || !assignee.isActive) {
        throw new ConflictError(
          "ASSIGNEE_INACTIVE",
          "The assigned user must be active.",
        );
      }
    }

    return this.taskRepository.create({
      projectId: input.projectId,
      createdByUserId: input.requesterId,
      assignedToUserId: input.assignedToUserId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
    });
  }
}
