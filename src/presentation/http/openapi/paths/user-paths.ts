import type { OpenAPIV3 } from "openapi-types";

import { USER_ROLES } from "../../../../domain/entities/user.js";

import {
  USER_SORT_FIELDS,
  USER_SORT_ORDERS,
} from "../../../../domain/repositories/user-repository.js";

const userIdParameter: OpenAPIV3.ParameterObject = {
  name: "userId",
  in: "path",
  required: true,
  description: "User identifier.",
  schema: {
    type: "string",
    format: "uuid",
  },
};

const profileProperties: OpenAPIV3.SchemaObject["properties"] = {
  username: {
    type: "string",
    minLength: 3,
    maxLength: 50,
    pattern: "^[a-zA-Z0-9._-]+$",
    example: "emre",
  },

  email: {
    type: "string",
    format: "email",
    maxLength: 254,
    example: "emre@example.com",
  },
};

export const userPaths: OpenAPIV3.PathsObject = {
  "/users/me": {
    get: {
      tags: ["Users"],
      summary: "Get the current user",
      description: "Returns the profile of the authenticated and active user.",
      operationId: "getCurrentUser",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        "200": {
          description: "The current user was returned successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UserResponse",
              },
            },
          },
        },
        "401": {
          $ref: "#/components/responses/UnauthenticatedError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },

    put: {
      tags: ["Users"],
      summary: "Update the current user",
      description:
        "Updates the username and email address of the authenticated user.",
      operationId: "updateCurrentUser",

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
              required: ["username", "email"],
              properties: profileProperties,
            },
          },
        },
      },

      responses: {
        "200": {
          description: "The current user was updated successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UserResponse",
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
        "409": {
          $ref: "#/components/responses/ConflictError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  "/users": {
    get: {
      tags: ["Users"],
      summary: "List users",
      description:
        "Returns filtered, sorted, and paginated users. Administrator access is required.",
      operationId: "listUsers",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "search",
          in: "query",
          description: "Searches usernames and email addresses.",
          schema: {
            type: "string",
            minLength: 1,
            maxLength: 254,
          },
        },
        {
          name: "role",
          in: "query",
          description: "Comma-separated user roles. For example: user,admin.",
          schema: {
            type: "string",
            enum: [...USER_ROLES],
            example: "user,admin",
          },
        },
        {
          name: "isActive",
          in: "query",
          description: "Filters users by active status.",
          schema: {
            type: "string",
            enum: ["true", "false"],
          },
        },
        {
          name: "sortBy",
          in: "query",
          description: "Field used to sort users.",
          schema: {
            type: "string",
            enum: [...USER_SORT_FIELDS],
            default: "createdAt",
          },
        },
        {
          name: "sortOrder",
          in: "query",
          description: "Sort direction.",
          schema: {
            type: "string",
            enum: [...USER_SORT_ORDERS],
            default: "desc",
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
          description: "Number of users returned per page.",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
      ],

      responses: {
        "200": {
          description: "The users were returned successfully.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data", "meta"],
                properties: {
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/User",
                    },
                  },
                  meta: {
                    type: "object",
                    required: ["pagination"],
                    properties: {
                      pagination: {
                        $ref: "#/components/schemas/Pagination",
                      },
                    },
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
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  "/users/{userId}/status": {
    parameters: [userIdParameter],

    patch: {
      tags: ["Users"],
      summary: "Update a user's active status",
      description:
        "Activates or deactivates a user account. Administrator access is required, and administrators cannot deactivate their own account.",
      operationId: "updateUserStatus",

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
              required: ["isActive"],
              properties: {
                isActive: {
                  type: "boolean",
                  example: false,
                },
              },
            },
          },
        },
      },

      responses: {
        "200": {
          description: "The user's active status was updated successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UserResponse",
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
};
