import type { Task, TaskPriority, TaskStatus } from "../entities/task.js";

export const TASK_SORT_FIELDS = [
  "title",
  "status",
  "priority",
  "dueDate",
  "completedAt",
  "createdAt",
  "updatedAt",
] as const;

export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export const TASK_SORT_ORDERS = ["asc", "desc"] as const;

export type TaskSortOrder = (typeof TASK_SORT_ORDERS)[number];

export interface TaskSort {
  field: TaskSortField;
  order: TaskSortOrder;
}

export interface CreateTaskData {
  projectId: string;
  createdByUserId: string;
  assignedToUserId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: Date | null;
}

export interface UpdateTaskData {
  assignedToUserId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
}

export interface FindTasksOptions {
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

  offset: number;
  limit: number;
}

export interface TaskListResult {
  tasks: Task[];
  totalCount: number;
}

export interface TaskRepository {
  create(data: CreateTaskData): Promise<Task>;

  findById(id: string): Promise<Task | null>;

  findAllForProject(
    projectId: string,
    options: FindTasksOptions,
  ): Promise<TaskListResult>;

  update(id: string, data: UpdateTaskData): Promise<Task | null>;

  delete(id: string): Promise<boolean>;
}
