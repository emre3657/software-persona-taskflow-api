import mssql from "mssql";

import type {
  CreateUserData,
  UserRepository,
} from "../../domain/repositories/user-repository.js";

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

const userColumns = `
    Id,
    Username,
    Email,
    PasswordHash,
    Role,
    IsActive,
    CreatedAt,
    UpdatedAt
`;

export class SqlServerUserRepository implements UserRepository {
  constructor(private readonly pool: mssql.ConnectionPool) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.pool
      .request()
      .input("id", mssql.UniqueIdentifier, id).query<UserRow>(`
        SELECT ${userColumns}
        FROM dbo.Users
        WHERE Id = @id;
      `);

    const row = result.recordset[0];

    return row ? mapUserRow(row) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.pool
      .request()
      .input("username", mssql.NVarChar(50), username).query<UserRow>(`
        SELECT ${userColumns}
        FROM dbo.Users
        WHERE Username = @username;
      `);

    const row = result.recordset[0];

    return row ? mapUserRow(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool
      .request()
      .input("email", mssql.NVarChar(254), email).query<UserRow>(`
        SELECT ${userColumns}
        FROM dbo.Users
        WHERE Email = @email;
      `);

    const row = result.recordset[0];

    return row ? mapUserRow(row) : null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const result = await this.pool
      .request()
      .input("identifier", mssql.NVarChar(254), identifier).query<UserRow>(`
        SELECT ${userColumns}
        FROM dbo.Users
        WHERE Username = @identifier
           OR Email = @identifier;
      `);

    const row = result.recordset[0];

    return row ? mapUserRow(row) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const result = await this.pool
      .request()
      .input("username", mssql.NVarChar(50), data.username)
      .input("email", mssql.NVarChar(254), data.email)
      .input("passwordHash", mssql.NVarChar(255), data.passwordHash)
      .input("role", mssql.NVarChar(20), data.role).query<UserRow>(`
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

    const row = result.recordset[0];

    if (!row) {
      throw new Error("User creation did not return a record");
    }

    return mapUserRow(row);
  }
}
