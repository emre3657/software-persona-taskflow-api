import type { Task } from "../../../domain/entities/task.js";
import type { User } from "../../../domain/entities/user.js";

import type { ProjectMemberRepository } from "../../../domain/repositories/project-member-repository.js";
import type { TaskRepository } from "../../../domain/repositories/task-repository.js";
import type { UserRepository } from "../../../domain/repositories/user-repository.js";

import { ConflictError } from "../../../shared/errors/conflict-error.js";
import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";

interface AssignTaskInput {
  projectId: string;
  taskId: string;
  requesterId: string;
  requesterRole: User["role"];
  assignedToUserId: string | null;
}

export class AssignTask {
  constructor(
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly taskRepository: TaskRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: AssignTaskInput): Promise<Task> {
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

    const canManageAssignments =
      input.requesterRole === "admin" || requesterProjectRole === "manager";

    if (!canManageAssignments) {
      const isClaimingUnassignedTask =
        task.assignedToUserId === null &&
        input.assignedToUserId === input.requesterId;

      const isLeavingOwnTask =
        task.assignedToUserId === input.requesterId &&
        input.assignedToUserId === null;

      const assignmentIsUnchanged =
        task.assignedToUserId === input.assignedToUserId;

      if (
        !isClaimingUnassignedTask &&
        !isLeavingOwnTask &&
        !assignmentIsUnchanged
      ) {
        throw new ForbiddenError(
          "Project members can only claim unassigned tasks or leave tasks assigned to themselves.",
        );
      }
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

    const updatedTask = await this.taskRepository.update(task.id, {
      assignedToUserId: input.assignedToUserId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
    });

    if (!updatedTask) {
      throw new NotFoundError("Task not found.");
    }

    return updatedTask;
  }
}
