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

const projectBodyProperties: OpenAPIV3.SchemaObject["properties"] = {
  name: {
    type: "string",
    minLength: 1,
    maxLength: 200,
    example: "TaskFlow API",
  },

  description: {
    type: "string",
    maxLength: 2000,
    nullable: true,
    example: "Backend development project.",
  },
};

export const projectPaths: OpenAPIV3.PathsObject = {
  "/projects": {
    post: {
      tags: ["Projects"],
      summary: "Create a project",
      description:
        "Creates a project and adds the authenticated user as its manager.",
      operationId: "createProject",

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
              required: ["name"],
              properties: projectBodyProperties,
            },
          },
        },
      },

      responses: {
        "201": {
          description: "The project was created successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ProjectResponse",
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
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },

    get: {
      tags: ["Projects"],
      summary: "List the current user's projects",
      description:
        "Returns projects in which the authenticated user is a member.",
      operationId: "listProjects",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        "200": {
          description: "The projects were returned successfully.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data"],
                properties: {
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/ProjectWithRole",
                    },
                  },
                },
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
  },

  "/projects/{projectId}": {
    parameters: [projectIdParameter],

    get: {
      tags: ["Projects"],
      summary: "Get a project",
      description:
        "Returns the project to one of its members. Administrators can access a project without being a member.",
      operationId: "getProject",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        "200": {
          description: "The project was returned successfully.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data"],
                properties: {
                  data: {
                    oneOf: [
                      {
                        $ref: "#/components/schemas/ProjectWithRole",
                      },
                      {
                        $ref: "#/components/schemas/Project",
                      },
                    ],
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
        "404": {
          $ref: "#/components/responses/NotFoundError",
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },

    put: {
      tags: ["Projects"],
      summary: "Update a project",
      description:
        "Updates project details. The requester must be a project manager or an administrator.",
      operationId: "updateProject",

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
              minProperties: 1,
              properties: projectBodyProperties,
            },
          },
        },
      },

      responses: {
        "200": {
          description: "The project was updated successfully.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ProjectResponse",
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
      tags: ["Projects"],
      summary: "Delete a project",
      description:
        "Deletes an empty project. The requester must be a project manager or an administrator and must confirm the operation with their password.",
      operationId: "deleteProject",

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
              required: ["password"],
              properties: {
                password: {
                  type: "string",
                  format: "password",
                  writeOnly: true,
                  description:
                    "Password of the authenticated user confirming the deletion.",
                  example: "StrongPassword123!",
                },
              },
            },
          },
        },
      },

      responses: {
        "204": {
          description: "The project was deleted successfully.",
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
