import type { OpenAPIV3 } from "openapi-types";

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

export const projectMemberPaths: OpenAPIV3.PathsObject = {
  "/projects/{projectId}/members": {
    parameters: [projectIdParameter],

    get: {
      tags: ["Project Members"],
      summary: "List project members",
      description:
        "Returns the members of a project. The requester must be a project member or an administrator.",
      operationId: "listProjectMembers",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        "200": {
          description: "The project members were returned successfully.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data"],
                properties: {
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/ProjectMemberDetails",
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
        "404": {
          $ref: "#/components/responses/NotFoundError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },

    post: {
      tags: ["Project Members"],
      summary: "Add a project member",
      description:
        "Adds a user to a project. The requester must be a project manager or an administrator.",
      operationId: "addProjectMember",

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
              required: ["userId", "projectRole"],
              properties: {
                userId: {
                  type: "string",
                  format: "uuid",
                  description: "User to add to the project.",
                },
                projectRole: {
                  type: "string",
                  enum: ["member", "manager"],
                  description: "Role assigned within the project.",
                  example: "member",
                },
              },
            },
          },
        },
      },

      responses: {
        "201": {
          description: "The project member was added successfully.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data"],
                properties: {
                  data: {
                    $ref: "#/components/schemas/ProjectMember",
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
        "409": {
          $ref: "#/components/responses/ConflictError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  "/projects/{projectId}/members/{userId}": {
    parameters: [projectIdParameter, userIdParameter],

    delete: {
      tags: ["Project Members"],
      summary: "Remove a project member",
      description:
        "Removes a user from a project. The requester must be a project manager or an administrator. A member with assigned tasks cannot be removed.",
      operationId: "removeProjectMember",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        "204": {
          description: "The project member was removed successfully.",
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
