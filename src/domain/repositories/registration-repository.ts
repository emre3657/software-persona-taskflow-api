import type { User, UserRole } from "../entities/user.js";

export interface CreateRegistrationData {
  user: {
    username: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  };

  refreshToken: {
    tokenFamilyId: string;
    tokenHash: string;
    expiresAt: Date;
  };
}

export interface RegistrationRepository {
  createUserWithRefreshToken(data: CreateRegistrationData): Promise<User>;
}
