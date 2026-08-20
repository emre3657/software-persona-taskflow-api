import type { OpenAPIV3 } from "openapi-types";

import { openApiComponents } from "./components.js";

import { authPaths } from "./paths/auth-paths.js";
import { projectMemberPaths } from "./paths/project-member-paths.js";
import { projectPaths } from "./paths/project-paths.js";
import { taskPaths } from "./paths/task-paths.js";
import { userPaths } from "./paths/user-paths.js";

export const openApiDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",

  info: {
    title: "TaskFlow API",
    version: "1.0.0",
    description:
      "REST API for managing users, authentication sessions, projects, project members, and tasks.",
  },

  servers: [
    {
      url: "/api/v1",
      description: "Current server",
    },
  ],

  tags: [
    {
      name: "Health",
      description: "Application health checks.",
    },
    {
      name: "Authentication",
      description: "Registration, login, token refresh, and logout operations.",
    },
    {
      name: "Users",
      description: "Current-user and administrator user-management operations.",
    },
    {
      name: "Projects",
      description: "Project management operations.",
    },
    {
      name: "Project Members",
      description: "Project membership management operations.",
    },
    {
      name: "Tasks",
      description: "Project task management operations.",
    },
  ],

  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check application health",
        description:
          "Returns a successful response when the HTTP application is running.",
        operationId: "getHealth",

        responses: {
          "200": {
            description: "The application is healthy.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: {
                      type: "object",
                      required: ["status"],
                      properties: {
                        status: {
                          type: "string",
                          enum: ["ok"],
                          example: "ok",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "500": {
            $ref: "#/components/responses/InternalServerError",
          },
        },
      },
    },

    ...authPaths,
    ...userPaths,
    ...projectPaths,
    ...projectMemberPaths,
    ...taskPaths,
  },

  components: openApiComponents,
};
