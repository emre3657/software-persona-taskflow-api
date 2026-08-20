import type { OpenAPIV3 } from "openapi-types";

const refreshCookieHeader: OpenAPIV3.HeaderObject = {
  description:
    "HTTP-only refresh token cookie. The cookie value is not accessible to JavaScript.",
  schema: {
    type: "string",
  },
};

export const authPaths: OpenAPIV3.PathsObject = {
  "/auth/register": {
    post: {
      tags: ["Authentication"],
      summary: "Register a user",
      description:
        "Creates a user account, returns an access token, and sets a refresh token cookie.",
      operationId: "registerUser",
      security: [],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["username", "email", "password"],
              properties: {
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
                password: {
                  type: "string",
                  format: "password",
                  minLength: 8,
                  writeOnly: true,
                  example: "StrongPassword123!",
                  description:
                    "Must contain at least 8 characters and must not exceed 72 UTF-8 bytes.",
                },
              },
            },
          },
        },
      },

      responses: {
        "201": {
          description: "The user was registered successfully.",
          headers: {
            "Set-Cookie": refreshCookieHeader,
          },
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthSessionResponse",
              },
            },
          },
        },
        "400": {
          $ref: "#/components/responses/ValidationError",
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

  "/auth/login": {
    post: {
      tags: ["Authentication"],
      summary: "Log in",
      description:
        "Authenticates a user, returns an access token, and sets a refresh token cookie.",
      operationId: "loginUser",
      security: [],

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["identifier", "password"],
              properties: {
                identifier: {
                  type: "string",
                  maxLength: 254,
                  description: "Username or email address.",
                  example: "emre@example.com",
                },
                password: {
                  type: "string",
                  format: "password",
                  writeOnly: true,
                  example: "StrongPassword123!",
                },
              },
            },
          },
        },
      },

      responses: {
        "200": {
          description: "Authentication succeeded.",
          headers: {
            "Set-Cookie": refreshCookieHeader,
          },
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthSessionResponse",
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
  },

  "/auth/refresh": {
    post: {
      tags: ["Authentication"],
      summary: "Refresh the authentication session",
      description:
        "Rotates the refresh token, returns a new access token, and replaces the refresh token cookie.",
      operationId: "refreshSession",

      security: [
        {
          refreshTokenCookie: [],
        },
      ],

      responses: {
        "200": {
          description: "The authentication session was refreshed.",
          headers: {
            "Set-Cookie": refreshCookieHeader,
          },
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthSessionResponse",
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

  "/auth/logout": {
    post: {
      tags: ["Authentication"],
      summary: "Log out from the current session",
      description:
        "Revokes the current refresh token when present and clears the refresh token cookie.",
      operationId: "logoutUser",

      security: [
        {
          refreshTokenCookie: [],
        },
      ],

      responses: {
        "204": {
          description: "The current session was logged out successfully.",
          headers: {
            "Set-Cookie": refreshCookieHeader,
          },
        },
        "500": {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  "/auth/logout-all": {
    post: {
      tags: ["Authentication"],
      summary: "Log out from all sessions",
      description:
        "Revokes all active refresh tokens belonging to the authenticated user.",
      operationId: "logoutAllSessions",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        "204": {
          description: "All sessions were logged out successfully.",
          headers: {
            "Set-Cookie": refreshCookieHeader,
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
};
