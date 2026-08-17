import type { UserRole } from "../../domain/entities/user.js";

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: SessionUser;
  accessToken: string;

  // Returned internally so the controller can set the HttpOnly cookie.
  refreshToken: string;
}
