import type {
  Task,
  TaskPriority,
  TaskStatus,
} from "../../../domain/entities/task.js";
import type { User } from "../../../domain/entities/user.js";

import type { ProjectRepository } from "../../../domain/repositories/project-repository.js";
import type { ProjectMemberRepository } from "../../../domain/repositories/project-member-repository.js";
import type {
  TaskRepository,
  TaskSort,
} from "../../../domain/repositories/task-repository.js";

import { NotFoundError } from "../../../shared/errors/not-found-error.js";

interface ListTasksInput {
  projectId: string;
  requesterId: string;
  requesterRole: User["role"];

  search?: string;

  statuses?: TaskStatus[];
  priorities?: TaskPriority[];

  assignedToUserId?: string;
  createdByUserId?: string;

  unassigned?: boolean;
  overdue?: boolean;

  dueDateFrom?: Date;
  dueDateTo?: Date;

  createdAtFrom?: Date;
  createdAtTo?: Date;

  updatedAtFrom?: Date;
  updatedAtTo?: Date;

  completedAtFrom?: Date;
  completedAtTo?: Date;

  sorts: TaskSort[];

  page: number;
  pageSize: number;
}

interface TaskPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ListTasksResult {
  tasks: Task[];
  pagination: TaskPagination;
}

export class ListTasks {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(input: ListTasksInput): Promise<ListTasksResult> {
    const requesterProjectRole = await this.projectMemberRepository.findRole(
      input.projectId,
      input.requesterId,
    );

    if (!requesterProjectRole && input.requesterRole !== "admin") {
      throw new NotFoundError("Project not found.");
    }

    if (!requesterProjectRole) {
      const project = await this.projectRepository.findById(input.projectId);

      if (!project) {
        throw new NotFoundError("Project not found.");
      }
    }

    const offset = (input.page - 1) * input.pageSize;

    const result = await this.taskRepository.findAllForProject(
      input.projectId,
      {
        search: input.search,

        statuses: input.statuses,
        priorities: input.priorities,

        assignedToUserId: input.assignedToUserId,
        createdByUserId: input.createdByUserId,

        unassigned: input.unassigned,
        overdue: input.overdue,

        dueDateFrom: input.dueDateFrom,
        dueDateTo: input.dueDateTo,

        createdAtFrom: input.createdAtFrom,
        createdAtTo: input.createdAtTo,

        updatedAtFrom: input.updatedAtFrom,
        updatedAtTo: input.updatedAtTo,

        completedAtFrom: input.completedAtFrom,
        completedAtTo: input.completedAtTo,

        sorts: input.sorts,

        offset,
        limit: input.pageSize,
      },
    );

    return {
      tasks: result.tasks,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems: result.totalCount,
        totalPages: Math.ceil(result.totalCount / input.pageSize),
      },
    };
  }
}
