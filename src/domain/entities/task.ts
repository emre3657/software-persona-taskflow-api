export const TASK_STATUSES = ["todo", "in_progress", "completed"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  projectId: string;
  createdByUserId: string;
  assignedToUserId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
