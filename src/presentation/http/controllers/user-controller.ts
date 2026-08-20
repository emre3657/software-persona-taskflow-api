import type { Request, RequestHandler } from "express";

import { StatusCodes } from "http-status-codes";

import type { GetCurrentUser } from "../../../application/use-cases/users/get-current-user.js";
import type { ListUsers } from "../../../application/use-cases/users/list-users.js";
import type { UpdateCurrentUser } from "../../../application/use-cases/users/update-current-user.js";
import type { UpdateUserStatus } from "../../../application/use-cases/users/update-user-status.js";

import { UnauthenticatedError } from "../../../shared/errors/unauthenticated-error.js";

import {
  listUsersQuerySchema,
  updateCurrentUserBodySchema,
  updateUserStatusBodySchema,
  userIdParamsSchema,
} from "../validation/user-schemas.js";

export class UserController {
  constructor(
    private readonly getCurrentUser: GetCurrentUser,
    private readonly updateCurrentUser: UpdateCurrentUser,
    private readonly listUsers: ListUsers,
    private readonly updateUserStatus: UpdateUserStatus,
  ) {}

  private getAuthenticatedUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthenticatedError();
    }

    return req.user.id;
  }

  readonly getCurrent: RequestHandler = async (req, res) => {
    const userId = this.getAuthenticatedUserId(req);

    const user = await this.getCurrentUser.execute({ userId });

    res.status(StatusCodes.OK).json({
      data: user,
    });
  };

  readonly updateCurrent: RequestHandler = async (req, res) => {
    const userId = this.getAuthenticatedUserId(req);

    const body = updateCurrentUserBodySchema.parse(req.body);

    const user = await this.updateCurrentUser.execute({
      userId,
      username: body.username,
      email: body.email,
    });

    res.status(StatusCodes.OK).json({
      data: user,
    });
  };

  readonly list: RequestHandler = async (req, res) => {
    const requesterId = this.getAuthenticatedUserId(req);

    const query = listUsersQuerySchema.parse(req.query);

    const result = await this.listUsers.execute({
      requesterId,
      search: query.search,
      roles: query.role,
      isActive: query.isActive,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: query.page,
      pageSize: query.pageSize,
    });

    res.status(StatusCodes.OK).json({
      data: result.users,
      meta: {
        pagination: result.pagination,
      },
    });
  };

  readonly updateStatus: RequestHandler = async (req, res) => {
    const requesterId = this.getAuthenticatedUserId(req);

    const params = userIdParamsSchema.parse(req.params);
    const body = updateUserStatusBodySchema.parse(req.body);

    const user = await this.updateUserStatus.execute({
      requesterId,
      userId: params.userId,
      isActive: body.isActive,
    });

    res.status(StatusCodes.OK).json({
      data: user,
    });
  };
}
