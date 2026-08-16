import type { User, UserRole } from "../entities/user.js";

export interface CreateUserData {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;

  findByUsername(username: string): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  findByIdentifier(identifier: string): Promise<User | null>;

  create(data: CreateUserData): Promise<User>;
}
