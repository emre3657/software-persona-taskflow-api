import mssql from "mssql";

import type {
  CreateRegistrationData,
  RegistrationRepository,
} from "../../domain/repositories/registration-repository.js";

import type { User, UserRole } from "../../domain/entities/user.js";

interface UserRow {
  Id: string;
  Username: string;
  Email: string;
  PasswordHash: string;
  Role: UserRole;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

function mapUserRow(row: UserRow): User {
  return {
    id: row.Id,
    username: row.Username,
    email: row.Email,
    passwordHash: row.PasswordHash,
    role: row.Role,
    isActive: row.IsActive,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

export class SqlServerRegistrationRepository implements RegistrationRepository {
  constructor(private readonly pool: mssql.ConnectionPool) {}

  async createUserWithRefreshToken(
    data: CreateRegistrationData,
  ): Promise<User> {
    const transaction = new mssql.Transaction(this.pool);

    await transaction.begin(mssql.ISOLATION_LEVEL.READ_COMMITTED);

    try {
      const userResult = await new mssql.Request(transaction)
        .input("username", mssql.NVarChar(50), data.user.username)
        .input("email", mssql.NVarChar(254), data.user.email)
        .input("passwordHash", mssql.NVarChar(255), data.user.passwordHash)
        .input("role", mssql.NVarChar(20), data.user.role).query<UserRow>(`
            INSERT INTO dbo.Users
            (
              Username,
              Email,
              PasswordHash,
              Role
            )
            OUTPUT
              INSERTED.Id,
              INSERTED.Username,
              INSERTED.Email,
              INSERTED.PasswordHash,
              INSERTED.Role,
              INSERTED.IsActive,
              INSERTED.CreatedAt,
              INSERTED.UpdatedAt
            VALUES
            (
              @username,
              @email,
              @passwordHash,
              @role
            );
          `);

      const userRow = userResult.recordset[0];

      if (!userRow) {
        throw new Error("User creation did not return a record");
      }

      await new mssql.Request(transaction)
        .input("userId", mssql.UniqueIdentifier, userRow.Id)
        .input(
          "tokenFamilyId",
          mssql.UniqueIdentifier,
          data.refreshToken.tokenFamilyId,
        )
        .input("tokenHash", mssql.Char(64), data.refreshToken.tokenHash)
        .input("expiresAt", mssql.DateTime2(3), data.refreshToken.expiresAt)
        .query(`
          INSERT INTO dbo.RefreshTokens
          (
            UserId,
            TokenFamilyId,
            TokenHash,
            ExpiresAt
          )
          VALUES
          (
            @userId,
            @tokenFamilyId,
            @tokenHash,
            @expiresAt
          );
        `);

      await transaction.commit();

      return mapUserRow(userRow);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
