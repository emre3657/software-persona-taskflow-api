import type { User, UserRole } from "../entities/user.js";

export const USER_SORT_FIELDS = [
  "username",
  "email",
  "role",
  "isActive",
  "createdAt",
  "updatedAt",
] as const;

export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export const USER_SORT_ORDERS = ["asc", "desc"] as const;

export type UserSortOrder = (typeof USER_SORT_ORDERS)[number];

export interface CreateUserData {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UpdateUserProfileData {
  username: string;
  email: string;
}

export interface FindUsersOptions {
  search?: string;
  roles?: UserRole[];
  isActive?: boolean;

  sortBy: UserSortField;
  sortOrder: UserSortOrder;

  offset: number;
  limit: number;
}

export type UserListItem = Omit<User, "passwordHash">;

export interface UserListResult {
  users: UserListItem[];
  totalCount: number;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;

  findByUsername(username: string): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  findByIdentifier(identifier: string): Promise<User | null>;

  findAll(options: FindUsersOptions): Promise<UserListResult>;

  create(data: CreateUserData): Promise<User>;

  updateProfile(id: string, data: UpdateUserProfileData): Promise<User | null>;

  updateActiveStatus(id: string, isActive: boolean): Promise<User | null>;
}
