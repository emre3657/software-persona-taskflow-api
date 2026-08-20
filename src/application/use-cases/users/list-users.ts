import type { UserRole } from "../../../domain/entities/user.js";

import type {
  UserListItem,
  UserRepository,
  UserSortField,
  UserSortOrder,
} from "../../../domain/repositories/user-repository.js";

import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { UnauthenticatedError } from "../../../shared/errors/unauthenticated-error.js";

interface ListUsersInput {
  requesterId: string;

  search?: string;
  roles?: UserRole[];
  isActive?: boolean;

  sortBy: UserSortField;
  sortOrder: UserSortOrder;

  page: number;
  pageSize: number;
}

interface UserPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ListUsersResult {
  users: UserListItem[];
  pagination: UserPagination;
}

export class ListUsers {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ListUsersInput): Promise<ListUsersResult> {
    const requester = await this.userRepository.findById(input.requesterId);

    if (!requester || !requester.isActive) {
      throw new UnauthenticatedError("Authentication is no longer valid.");
    }

    if (requester.role !== "admin") {
      throw new ForbiddenError("Only administrators can list users.");
    }

    const offset = (input.page - 1) * input.pageSize;

    const result = await this.userRepository.findAll({
      search: input.search,
      roles: input.roles,
      isActive: input.isActive,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      offset,
      limit: input.pageSize,
    });

    return {
      users: result.users,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems: result.totalCount,
        totalPages: Math.ceil(result.totalCount / input.pageSize),
      },
    };
  }
}
