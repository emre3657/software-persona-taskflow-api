import type { OpenAPIV3 } from "openapi-types";

import {
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "../../../../domain/entities/task.js";

import {
  TASK_SORT_FIELDS,
  TASK_SORT_ORDERS,
} from "../../../../domain/repositories/task-repository.js";

const projectIdParameter: OpenAPIV3.ParameterObject = {
  name: "projectId",
  in: "path",
  required: true,
  description: "Project identifier.",
  schema: {
    type: "string",
    format: "uuid",
  },
};

const taskIdParameter: OpenAPIV3.ParameterObject = {
  name: "taskId",
  in: "path",
  required: true,
  description: "Task identifier.",
  schema: {
    type: "string",
    format: "uuid",
  },
};

const dateRangeSchema: OpenAPIV3.SchemaObject = {
  oneOf: [
    {
      type: "string",
      format: "date",
    },
    {
      type: "string",
      format: "date-time",
    },
  ],
};

const taskSortValues = TASK_SORT_FIELDS.flatMap((field) =>
  TASK_SORT_ORDERS.map((order) => `${field}_${order}`),
);

const taskQueryParameters: OpenAPIV3.ParameterObject[] = [
  {
    name: "search",
    in: "query",
    description: "Searches task titles and descriptions.",
    schema: {
      type: "string",
      minLength: 1,
      maxLength: 200,
    },
  },
  {
    name: "status",
    in: "query",
    description: "Comma-separated task statuses. Duplicate values are ignored.",
    schema: {
      type: "string",
      example: "todo,in_progress",
    },
  },
  {
    name: "priority",
    in: "query",
    description:
      "Comma-separated task priorities. Duplicate values are ignored.",
    schema: {
      type: "string",
      example: "high,medium",
    },
  },
  {
    name: "assignedToUserId",
    in: "query",
    description: "Filters tasks assigned to a specific user.",
    schema: {
      type: "string",
      format: "uuid",
    },
  },
  {
    name: "createdByUserId",
    in: "query",
    description: "Filters tasks created by a specific user.",
    schema: {
      type: "string",
      format: "uuid",
    },
  },
  {
    name: "unassigned",
    in: "query",
    description:
      "When true, returns only unassigned tasks. Cannot be combined with assignedToUserId.",
    schema: {
      type: "string",
      enum: ["true", "false"],
    },
  },
  {
    name: "overdue",
    in: "query",
    description:
      "When true, returns incomplete tasks whose due date is in the past.",
    schema: {
      type: "string",
      enum: ["true", "false"],
    },
  },
  {
    name: "dueDateFrom",
    in: "query",
    description: "Inclusive lower boundary for the task due date.",
    schema: dateRangeSchema,
  },
  {
    name: "dueDateTo",
    in: "query",
    description: "Inclusive upper boundary for the task due date.",
    schema: dateRangeSchema,
  },
  {
    name: "createdAtFrom",
    in: "query",
    description: "Inclusive lower boundary for the creation date.",
    schema: dateRangeSchema,
  },
  {
    name: "createdAtTo",
    in: "query",
    description: "Inclusive upper boundary for the creation date.",
    schema: dateRangeSchema,
  },
  {
    name: "updatedAtFrom",
    in: "query",
    description: "Inclusive lower boundary for the last update date.",
    schema: dateRangeSchema,
  },
  {
    name: "updatedAtTo",
    in: "query",
    description: "Inclusive upper boundary for the last update date.",
    schema: dateRangeSchema,
  },
  {
    name: "completedAtFrom",
    in: "query",
    description: "Inclusive lower boundary for the completion date.",
    schema: dateRangeSchema,
  },
  {
    name: "completedAtTo",
    in: "query",
    description: "Inclusive upper boundary for the completion date.",
    schema: dateRangeSchema,
  },
  {
    name: "sort",
    in: "query",
    description:
      "Comma-separated sort expressions in field_order format. At most three unique sort fields are allowed.",
    schema: {
      type: "string",
      enum: taskSortValues,
      default: "createdAt_desc",
      example: "priority_desc,dueDate_asc",
    },
  },
  {
    name: "page",
    in: "query",
    description: "Page number.",
    schema: {
      type: "integer",
      minimum: 1,
      default: 1,
    },
  },
  {
    name: "pageSize",
    in: "query",
    description: "Number of tasks returned per page.",
    schema: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      default: 20,
    },
  },
];

const taskContentProperties: OpenAPIV3.SchemaObject["properties"] = {
  title: {
    type: "string",
    minLength: 1,
    maxLength: 200,
    example: "Create OpenAPI documentation",
  },
  description: {
    type: "string",
    maxLength: 2000,
    nullable: true,
    example: "Document all TaskFlow endpoints.",
  },
  priority: {
    type: "string",
    enum: [...TASK_PRIORITIES],
    default: "medium",
  },
  dueDate: {
    type: "string",
    format: "date-time",
    nullable: true,
    example: "2026-08-31T18:00:00.000Z",
  },
};

export const taskPaths: OpenAPIV3.PathsObject = {
  "/projects/{projectId}/tasks": {
    parameters: [projectIdParameter],

    post: {
      tags: ["Tasks"],
      summary: "Create a task",
      description:
        "Creates a task in a project. Project members and administrators can create tasks.",
      operationId: "createTask",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title"],
              properties: {
                ...taskContentProperties,

                assignedToUserId: {
                  type: "string",
                  format: "uuid",
                  nullable: true,
                  description:
                    "Project member assigned to the task. Omit or set to null to create an unassigned task.",
                },
              },
            },
          },
        },
      },

      responses: {
        "201": {
          description: "The task was created successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TaskResponse",
              },
            },
          },
        },
        "400": {
          $ref: "#/components/responses/ValidationError",
        },
        "401": {
          $ref: "#/components/responses/UnauthenticatedError",
        },
        "403": {
          $ref: "#/components/responses/ForbiddenError",
        },
        "404": {
          $ref: "#/components/responses/NotFoundError",
        },
        "409": {
          $ref: "#/components/responses/ConflictError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },

    get: {
      tags: ["Tasks"],
      summary: "List project tasks",
      description:
        "Returns filtered, sorted, and paginated tasks belonging to a project.",
      operationId: "listTasks",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: taskQueryParameters,

      responses: {
        "200": {
          description: "The tasks were returned successfully.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data", "meta"],
                properties: {
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Task",
                    },
                  },
                  meta: {
                    $ref: "#/components/schemas/Pagination",
                  },
                },
              },
            },
          },
        },
        "400": {
          $ref: "#/components/responses/ValidationError",
        },
        "401": {
          $ref: "#/components/responses/UnauthenticatedError",
        },
        "403": {
          $ref: "#/components/responses/ForbiddenError",
        },
        "404": {
          $ref: "#/components/responses/NotFoundError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  "/projects/{projectId}/tasks/{taskId}": {
    parameters: [projectIdParameter, taskIdParameter],

    get: {
      tags: ["Tasks"],
      summary: "Get a task",
      description: "Returns a task belonging to the specified project.",
      operationId: "getTask",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        "200": {
          description: "The task was returned successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TaskResponse",
              },
            },
          },
        },
        "400": {
          $ref: "#/components/responses/ValidationError",
        },
        "401": {
          $ref: "#/components/responses/UnauthenticatedError",
        },
        "403": {
          $ref: "#/components/responses/ForbiddenError",
        },
        "404": {
          $ref: "#/components/responses/NotFoundError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },

    put: {
      tags: ["Tasks"],
      summary: "Update task content",
      description:
        "Updates the task title, description, priority, and due date. All four fields are required.",
      operationId: "updateTask",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "description", "priority", "dueDate"],
              properties: taskContentProperties,
            },
          },
        },
      },

      responses: {
        "200": {
          description: "The task was updated successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TaskResponse",
              },
            },
          },
        },
        "400": {
          $ref: "#/components/responses/ValidationError",
        },
        "401": {
          $ref: "#/components/responses/UnauthenticatedError",
        },
        "403": {
          $ref: "#/components/responses/ForbiddenError",
        },
        "404": {
          $ref: "#/components/responses/NotFoundError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },

    delete: {
      tags: ["Tasks"],
      summary: "Delete a task",
      description:
        "Deletes a task. The requester must be a project manager or an administrator.",
      operationId: "deleteTask",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        "204": {
          description: "The task was deleted successfully.",
        },
        "400": {
          $ref: "#/components/responses/ValidationError",
        },
        "401": {
          $ref: "#/components/responses/UnauthenticatedError",
        },
        "403": {
          $ref: "#/components/responses/ForbiddenError",
        },
        "404": {
          $ref: "#/components/responses/NotFoundError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  "/projects/{projectId}/tasks/{taskId}/assignee": {
    parameters: [projectIdParameter, taskIdParameter],

    patch: {
      tags: ["Tasks"],
      summary: "Update the task assignee",
      description:
        "Assigns the task to a project member or sets it to null. Members may claim an unassigned task or unassign their own task; managers and administrators can assign project members.",
      operationId: "assignTask",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["assignedToUserId"],
              properties: {
                assignedToUserId: {
                  type: "string",
                  format: "uuid",
                  nullable: true,
                  description:
                    "Project member to assign, or null to remove the current assignee.",
                },
              },
            },
          },
        },
      },

      responses: {
        "200": {
          description: "The task assignee was updated successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TaskResponse",
              },
            },
          },
        },
        "400": {
          $ref: "#/components/responses/ValidationError",
        },
        "401": {
          $ref: "#/components/responses/UnauthenticatedError",
        },
        "403": {
          $ref: "#/components/responses/ForbiddenError",
        },
        "404": {
          $ref: "#/components/responses/NotFoundError",
        },
        "409": {
          $ref: "#/components/responses/ConflictError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  "/projects/{projectId}/tasks/{taskId}/status": {
    parameters: [projectIdParameter, taskIdParameter],

    patch: {
      tags: ["Tasks"],
      summary: "Update the task status",
      description:
        "Updates the task status. The creator, assignee, project manager, or administrator can perform this action.",
      operationId: "updateTaskStatus",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["status"],
              properties: {
                status: {
                  type: "string",
                  enum: [...TASK_STATUSES],
                },
              },
            },
          },
        },
      },

      responses: {
        "200": {
          description: "The task status was updated successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TaskResponse",
              },
            },
          },
        },
        "400": {
          $ref: "#/components/responses/ValidationError",
        },
        "401": {
          $ref: "#/components/responses/UnauthenticatedError",
        },
        "403": {
          $ref: "#/components/responses/ForbiddenError",
        },
        "404": {
          $ref: "#/components/responses/NotFoundError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },
};
