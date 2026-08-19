import mssql from "mssql";

import type {
  Task,
  TaskPriority,
  TaskStatus,
} from "../../domain/entities/task.js";

import type {
  CreateTaskData,
  FindTasksOptions,
  TaskListResult,
  TaskRepository,
  TaskSort,
  TaskSortField,
  UpdateTaskData,
} from "../../domain/repositories/task-repository.js";

interface TaskRow {
  Id: string;
  ProjectId: string;
  CreatedByUserId: string;
  AssignedToUserId: string | null;
  Title: string;
  Description: string | null;
  Status: TaskStatus;
  Priority: TaskPriority;
  DueDate: Date | null;
  CompletedAt: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

interface TaskCountRow {
  TotalCount: number;
}

const taskColumns = `
  t.Id,
  t.ProjectId,
  t.CreatedByUserId,
  t.AssignedToUserId,
  t.Title,
  t.Description,
  t.Status,
  t.Priority,
  t.DueDate,
  t.CompletedAt,
  t.CreatedAt,
  t.UpdatedAt
`;

const insertedTaskColumns = `
  INSERTED.Id,
  INSERTED.ProjectId,
  INSERTED.CreatedByUserId,
  INSERTED.AssignedToUserId,
  INSERTED.Title,
  INSERTED.Description,
  INSERTED.Status,
  INSERTED.Priority,
  INSERTED.DueDate,
  INSERTED.CompletedAt,
  INSERTED.CreatedAt,
  INSERTED.UpdatedAt
`;

function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.Id,
    projectId: row.ProjectId,
    createdByUserId: row.CreatedByUserId,
    assignedToUserId: row.AssignedToUserId,
    title: row.Title,
    description: row.Description,
    status: row.Status,
    priority: row.Priority,
    dueDate: row.DueDate,
    completedAt: row.CompletedAt,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

function escapeLikePattern(value: string): string {
  return value
    .replaceAll("~", "~~")
    .replaceAll("%", "~%")
    .replaceAll("_", "~_")
    .replaceAll("[", "~[");
}

function createSortExpression(sort: TaskSort): string {
  const direction = sort.order === "asc" ? "ASC" : "DESC";

  switch (sort.field) {
    case "title":
      return `t.Title ${direction}`;

    case "status":
      return `
        CASE t.Status
          WHEN N'todo' THEN 1
          WHEN N'in_progress' THEN 2
          WHEN N'completed' THEN 3
        END ${direction}
      `;

    case "priority":
      return `
        CASE t.Priority
          WHEN N'low' THEN 1
          WHEN N'medium' THEN 2
          WHEN N'high' THEN 3
        END ${direction}
      `;

    case "dueDate":
      return `
        CASE WHEN t.DueDate IS NULL THEN 1 ELSE 0 END ASC,
        t.DueDate ${direction}
      `;

    case "completedAt":
      return `
        CASE WHEN t.CompletedAt IS NULL THEN 1 ELSE 0 END ASC,
        t.CompletedAt ${direction}
      `;

    case "createdAt":
      return `t.CreatedAt ${direction}`;

    case "updatedAt":
      return `t.UpdatedAt ${direction}`;
  }
}

function createOrderByClause(sorts: TaskSort[]): string {
  const defaultSorts: TaskSort[] = [
    {
      field: "createdAt",
      order: "desc",
    },
  ];

  const selectedSorts = sorts.length > 0 ? sorts : defaultSorts;

  const seenFields = new Set<TaskSortField>();

  const expressions = selectedSorts
    .filter((sort) => {
      if (seenFields.has(sort.field)) {
        return false;
      }

      seenFields.add(sort.field);
      return true;
    })
    .map(createSortExpression);

  expressions.push("t.Id ASC");

  return expressions.join(",\n");
}

function addTaskFilters(
  request: mssql.Request,
  projectId: string,
  options: FindTasksOptions,
): string {
  const conditions = ["t.ProjectId = @projectId"];

  request.input("projectId", mssql.UniqueIdentifier, projectId);

  if (options.search) {
    request.input(
      "search",
      mssql.NVarChar(500),
      `%${escapeLikePattern(options.search)}%`,
    );

    conditions.push(`
      (
        t.Title LIKE @search ESCAPE N'~'
        OR t.Description LIKE @search ESCAPE N'~'
      )
    `);
  }

  if (options.statuses?.length) {
    const parameters = options.statuses.map((status, index) => {
      const parameterName = `status${index}`;

      request.input(parameterName, mssql.NVarChar(20), status);

      return `@${parameterName}`;
    });

    conditions.push(`t.Status IN (${parameters.join(", ")})`);
  }

  if (options.priorities?.length) {
    const parameters = options.priorities.map((priority, index) => {
      const parameterName = `priority${index}`;

      request.input(parameterName, mssql.NVarChar(20), priority);

      return `@${parameterName}`;
    });

    conditions.push(`t.Priority IN (${parameters.join(", ")})`);
  }

  if (options.unassigned === true && options.assignedToUserId) {
    throw new Error(
      "Task filters cannot contain both unassigned and assignedToUserId.",
    );
  }

  if (options.unassigned === true) {
    conditions.push("t.AssignedToUserId IS NULL");
  } else if (options.assignedToUserId) {
    request.input(
      "assignedToUserId",
      mssql.UniqueIdentifier,
      options.assignedToUserId,
    );

    conditions.push("t.AssignedToUserId = @assignedToUserId");
  } else if (options.unassigned === false) {
    conditions.push("t.AssignedToUserId IS NOT NULL");
  }

  if (options.createdByUserId) {
    request.input(
      "createdByUserId",
      mssql.UniqueIdentifier,
      options.createdByUserId,
    );

    conditions.push("t.CreatedByUserId = @createdByUserId");
  }

  if (options.overdue === true) {
    conditions.push(`
      t.DueDate < SYSUTCDATETIME()
      AND t.Status <> N'completed'
    `);
  } else if (options.overdue === false) {
    conditions.push(`
      (
        t.DueDate IS NULL
        OR t.DueDate >= SYSUTCDATETIME()
        OR t.Status = N'completed'
      )
    `);
  }

  addDateRange(
    request,
    conditions,
    "dueDate",
    "t.DueDate",
    options.dueDateFrom,
    options.dueDateTo,
  );

  addDateRange(
    request,
    conditions,
    "createdAt",
    "t.CreatedAt",
    options.createdAtFrom,
    options.createdAtTo,
  );

  addDateRange(
    request,
    conditions,
    "updatedAt",
    "t.UpdatedAt",
    options.updatedAtFrom,
    options.updatedAtTo,
  );

  addDateRange(
    request,
    conditions,
    "completedAt",
    "t.CompletedAt",
    options.completedAtFrom,
    options.completedAtTo,
  );

  return conditions.join("\nAND ");
}

function addDateRange(
  request: mssql.Request,
  conditions: string[],
  parameterPrefix: string,
  column: string,
  from: Date | undefined,
  to: Date | undefined,
): void {
  if (from) {
    const parameterName = `${parameterPrefix}From`;

    request.input(parameterName, mssql.DateTime2(3), from);

    conditions.push(`${column} >= @${parameterName}`);
  }

  if (to) {
    const parameterName = `${parameterPrefix}To`;

    request.input(parameterName, mssql.DateTime2(3), to);

    conditions.push(`${column} <= @${parameterName}`);
  }
}

export class SqlServerTaskRepository implements TaskRepository {
  constructor(private readonly pool: mssql.ConnectionPool) {}

  async create(data: CreateTaskData): Promise<Task> {
    const result = await this.pool
      .request()
      .input("projectId", mssql.UniqueIdentifier, data.projectId)
      .input("createdByUserId", mssql.UniqueIdentifier, data.createdByUserId)
      .input("assignedToUserId", mssql.UniqueIdentifier, data.assignedToUserId)
      .input("title", mssql.NVarChar(200), data.title)
      .input("description", mssql.NVarChar(2000), data.description)
      .input("priority", mssql.NVarChar(20), data.priority)
      .input("dueDate", mssql.DateTime2(3), data.dueDate).query<TaskRow>(`
        INSERT INTO dbo.Tasks
        (
          ProjectId,
          CreatedByUserId,
          AssignedToUserId,
          Title,
          Description,
          Priority,
          DueDate
        )
        OUTPUT
          ${insertedTaskColumns}
        VALUES
        (
          @projectId,
          @createdByUserId,
          @assignedToUserId,
          @title,
          @description,
          @priority,
          @dueDate
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Task creation did not return a record.");
    }

    return mapTaskRow(row);
  }

  async findById(id: string): Promise<Task | null> {
    const result = await this.pool
      .request()
      .input("id", mssql.UniqueIdentifier, id).query<TaskRow>(`
        SELECT
          ${taskColumns}
        FROM dbo.Tasks AS t
        WHERE t.Id = @id;
      `);

    const row = result.recordset[0];

    return row ? mapTaskRow(row) : null;
  }

  async findAllForProject(
    projectId: string,
    options: FindTasksOptions,
  ): Promise<TaskListResult> {
    const request = this.pool.request();

    const whereClause = addTaskFilters(request, projectId, options);

    const orderByClause = createOrderByClause(options.sorts);

    request
      .input("offset", mssql.Int, options.offset)
      .input("limit", mssql.Int, options.limit);

    const result = await request.query(`
      SELECT
        COUNT(*) AS TotalCount
      FROM dbo.Tasks AS t
      WHERE ${whereClause};

      SELECT
        ${taskColumns}
      FROM dbo.Tasks AS t
      WHERE ${whereClause}
      ORDER BY
        ${orderByClause}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY;
    `);

    const { recordsets } = result;

    if (!Array.isArray(recordsets)) {
      throw new Error("Task query did not return the expected recordsets.");
    }

    const countRows = recordsets[0] as TaskCountRow[] | undefined;

    const taskRows = recordsets[1] as TaskRow[] | undefined;

    return {
      tasks: (taskRows ?? []).map(mapTaskRow),
      totalCount: countRows?.[0]?.TotalCount ?? 0,
    };
  }

  async update(id: string, data: UpdateTaskData): Promise<Task | null> {
    const result = await this.pool
      .request()
      .input("id", mssql.UniqueIdentifier, id)
      .input("assignedToUserId", mssql.UniqueIdentifier, data.assignedToUserId)
      .input("title", mssql.NVarChar(200), data.title)
      .input("description", mssql.NVarChar(2000), data.description)
      .input("status", mssql.NVarChar(20), data.status)
      .input("priority", mssql.NVarChar(20), data.priority)
      .input("dueDate", mssql.DateTime2(3), data.dueDate)
      .input("completedAt", mssql.DateTime2(3), data.completedAt)
      .query<TaskRow>(`
        UPDATE dbo.Tasks
        SET
          AssignedToUserId = @assignedToUserId,
          Title = @title,
          Description = @description,
          Status = @status,
          Priority = @priority,
          DueDate = @dueDate,
          CompletedAt = @completedAt,
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          ${insertedTaskColumns}
        WHERE Id = @id;
      `);

    const row = result.recordset[0];

    return row ? mapTaskRow(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool
      .request()
      .input("id", mssql.UniqueIdentifier, id).query(`
        DELETE FROM dbo.Tasks
        WHERE Id = @id;
      `);

    return (result.rowsAffected[0] ?? 0) > 0;
  }
}
