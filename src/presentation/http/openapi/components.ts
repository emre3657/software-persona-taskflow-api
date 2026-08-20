import type { OpenAPIV3 } from "openapi-types";

const problemContent = {
  "application/problem+json": {
    schema: {
      $ref: "#/components/schemas/ProblemDetails",
    },
  },
};

export const openApiComponents: OpenAPIV3.ComponentsObject = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Access token returned by register, login, or refresh.",
    },

    refreshTokenCookie: {
      type: "apiKey",
      in: "cookie",
      name: "refreshToken",
      description: "HTTP-only refresh token cookie.",
    },
  },

  schemas: {
    User: {
      type: "object",
      required: [
        "id",
        "username",
        "email",
        "role",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
      properties: {
        id: {
          type: "string",
          format: "uuid",
        },
        username: {
          type: "string",
          example: "emre",
        },
        email: {
          type: "string",
          format: "email",
          example: "emre@example.com",
        },
        role: {
          type: "string",
          enum: ["user", "admin"],
        },
        isActive: {
          type: "boolean",
        },
        createdAt: {
          type: "string",
          format: "date-time",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
        },
      },
    },

    Project: {
      type: "object",
      required: [
        "id",
        "name",
        "description",
        "createdByUserId",
        "createdAt",
        "updatedAt",
      ],
      properties: {
        id: {
          type: "string",
          format: "uuid",
        },
        name: {
          type: "string",
          example: "TaskFlow API",
        },
        description: {
          type: "string",
          nullable: true,
          example: "Backend development project.",
        },
        createdByUserId: {
          type: "string",
          format: "uuid",
        },
        createdAt: {
          type: "string",
          format: "date-time",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
        },
      },
    },

    ProjectWithRole: {
      allOf: [
        {
          $ref: "#/components/schemas/Project",
        },
        {
          type: "object",
          required: ["currentUserRole"],
          properties: {
            currentUserRole: {
              type: "string",
              enum: ["member", "manager"],
            },
          },
        },
      ],
    },

    ProjectMember: {
      type: "object",
      required: [
        "projectId",
        "userId",
        "projectRole",
        "joinedAt",
        "username",
        "email",
      ],
      properties: {
        projectId: {
          type: "string",
          format: "uuid",
        },
        userId: {
          type: "string",
          format: "uuid",
        },
        projectRole: {
          type: "string",
          enum: ["member", "manager"],
        },
        joinedAt: {
          type: "string",
          format: "date-time",
        },
        username: {
          type: "string",
        },
        email: {
          type: "string",
          format: "email",
        },
      },
    },

    Task: {
      type: "object",
      required: [
        "id",
        "projectId",
        "createdByUserId",
        "assignedToUserId",
        "title",
        "description",
        "status",
        "priority",
        "dueDate",
        "completedAt",
        "createdAt",
        "updatedAt",
      ],
      properties: {
        id: {
          type: "string",
          format: "uuid",
        },
        projectId: {
          type: "string",
          format: "uuid",
        },
        createdByUserId: {
          type: "string",
          format: "uuid",
        },
        assignedToUserId: {
          type: "string",
          format: "uuid",
          nullable: true,
        },
        title: {
          type: "string",
          example: "Create OpenAPI documentation",
        },
        description: {
          type: "string",
          nullable: true,
          example: "Document all TaskFlow endpoints.",
        },
        status: {
          type: "string",
          enum: ["todo", "in_progress", "completed"],
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
        },
        dueDate: {
          type: "string",
          format: "date-time",
          nullable: true,
        },
        completedAt: {
          type: "string",
          format: "date-time",
          nullable: true,
        },
        createdAt: {
          type: "string",
          format: "date-time",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
        },
      },
    },

    Pagination: {
      type: "object",
      required: ["page", "pageSize", "totalItems", "totalPages"],
      properties: {
        page: {
          type: "integer",
          minimum: 1,
        },
        pageSize: {
          type: "integer",
          minimum: 1,
        },
        totalItems: {
          type: "integer",
          minimum: 0,
        },
        totalPages: {
          type: "integer",
          minimum: 0,
        },
      },
    },

    AuthSessionResponse: {
      type: "object",
      required: ["data"],
      properties: {
        data: {
          type: "object",
          required: ["user", "accessToken"],
          properties: {
            user: {
              $ref: "#/components/schemas/User",
            },
            accessToken: {
              type: "string",
              description: "Short-lived JWT access token.",
            },
          },
        },
      },
    },

    UserResponse: {
      type: "object",
      required: ["data"],
      properties: {
        data: {
          $ref: "#/components/schemas/User",
        },
      },
    },

    ProjectResponse: {
      type: "object",
      required: ["data"],
      properties: {
        data: {
          $ref: "#/components/schemas/Project",
        },
      },
    },

    ProjectWithRoleResponse: {
      type: "object",
      required: ["data"],
      properties: {
        data: {
          $ref: "#/components/schemas/ProjectWithRole",
        },
      },
    },

    TaskResponse: {
      type: "object",
      required: ["data"],
      properties: {
        data: {
          $ref: "#/components/schemas/Task",
        },
      },
    },

    ProblemDetails: {
      type: "object",
      required: [
        "type",
        "title",
        "status",
        "detail",
        "instance",
        "code",
        "requestId",
      ],
      properties: {
        type: {
          type: "string",
          example: "urn:taskflow:problem:validation-error",
        },
        title: {
          type: "string",
          example: "Validation failed",
        },
        status: {
          type: "integer",
          example: 400,
        },
        detail: {
          type: "string",
          example: "The request contains invalid fields.",
        },
        instance: {
          type: "string",
          example: "/api/v1/users",
        },
        code: {
          type: "string",
          example: "VALIDATION_ERROR",
        },
        requestId: {
          type: "string",
          format: "uuid",
        },
      },
    },

    ValidationProblemDetails: {
      allOf: [
        {
          $ref: "#/components/schemas/ProblemDetails",
        },
        {
          type: "object",
          required: ["errors"],
          properties: {
            errors: {
              type: "array",
              items: {
                type: "object",
                required: ["path", "message"],
                properties: {
                  path: {
                    type: "string",
                    example: "email",
                  },
                  message: {
                    type: "string",
                    example: "Enter a valid email address.",
                  },
                },
              },
            },
          },
        },
      ],
    },
  },

  responses: {
    ValidationError: {
      description: "The request contains invalid fields.",
      content: {
        "application/problem+json": {
          schema: {
            $ref: "#/components/schemas/ValidationProblemDetails",
          },
        },
      },
    },

    UnauthenticatedError: {
      description: "Authentication is required or no longer valid.",
      content: problemContent,
    },

    ForbiddenError: {
      description:
        "The authenticated user is not permitted to perform this action.",
      content: problemContent,
    },

    NotFoundError: {
      description: "The requested resource was not found.",
      content: problemContent,
    },

    ConflictError: {
      description: "The request conflicts with the current resource state.",
      content: problemContent,
    },

    InternalServerError: {
      description: "An unexpected server error occurred.",
      content: problemContent,
    },
  },
};
