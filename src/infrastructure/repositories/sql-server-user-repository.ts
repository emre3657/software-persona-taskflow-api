import mssql from "mssql";

import type {
  CreateUserData,
  FindUsersOptions,
  UpdateUserProfileData,
  UserListItem,
  UserListResult,
  UserRepository,
  UserSortField,
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

interface UserListRow {
  Id: string;
  Username: string;
  Email: string;
  Role: UserRole;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

interface UserCountRow {
  TotalCount: number;
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

const insertedUserColumns = `
  INSERTED.Id,
  INSERTED.Username,
  INSERTED.Email,
  INSERTED.PasswordHash,
  INSERTED.Role,
  INSERTED.IsActive,
  INSERTED.CreatedAt,
  INSERTED.UpdatedAt
`;

const userListColumns = `
  u.Id,
  u.Username,
  u.Email,
  u.Role,
  u.IsActive,
  u.CreatedAt,
  u.UpdatedAt
`;

const userSortColumns: Record<UserSortField, string> = {
  username: "u.Username",
  email: "u.Email",
  role: "u.Role",
  isActive: "u.IsActive",
  createdAt: "u.CreatedAt",
  updatedAt: "u.UpdatedAt",
};

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

function mapUserListRow(row: UserListRow): UserListItem {
  return {
    id: row.Id,
    username: row.Username,
    email: row.Email,
    role: row.Role,
    isActive: row.IsActive,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

function escapeLikePattern(value: string): string {
  return value
    .replaceAll("~", "~~")
    .replaceAll("%", "~%")
    .replaceAll("_", "~_")
    .replaceAll("[", "~[");
}

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

  async findAll(options: FindUsersOptions): Promise<UserListResult> {
    const request = this.pool.request();
    const conditions: string[] = [];

    if (options.search) {
      request.input(
        "search",
        mssql.NVarChar(500),
        `%${escapeLikePattern(options.search)}%`,
      );

      conditions.push(`
        (
          u.Username LIKE @search ESCAPE N'~'
          OR u.Email LIKE @search ESCAPE N'~'
        )
      `);
    }

    if (options.roles?.length) {
      const parameters = options.roles.map((role, index) => {
        const parameterName = `role${index}`;

        request.input(parameterName, mssql.NVarChar(20), role);

        return `@${parameterName}`;
      });

      conditions.push(`u.Role IN (${parameters.join(", ")})`);
    }

    if (options.isActive !== undefined) {
      request.input("isActive", mssql.Bit, options.isActive);

      conditions.push("u.IsActive = @isActive");
    }

    request
      .input("offset", mssql.Int, options.offset)
      .input("limit", mssql.Int, options.limit);

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join("\nAND ")}` : "";

    const sortColumn = userSortColumns[options.sortBy];

    const sortOrder = options.sortOrder === "asc" ? "ASC" : "DESC";

    const result = await request.query(`
      SELECT
        COUNT(*) AS TotalCount
      FROM dbo.Users AS u
      ${whereClause};

      SELECT
        ${userListColumns}
      FROM dbo.Users AS u
      ${whereClause}
      ORDER BY
        ${sortColumn} ${sortOrder},
        u.Id ASC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY;
    `);

    const { recordsets } = result;

    if (!Array.isArray(recordsets)) {
      throw new Error("User query did not return the expected recordsets.");
    }

    const countRows = recordsets[0] as UserCountRow[] | undefined;

    const userRows = recordsets[1] as UserListRow[] | undefined;

    return {
      users: (userRows ?? []).map(mapUserListRow),
      totalCount: countRows?.[0]?.TotalCount ?? 0,
    };
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
          ${insertedUserColumns}
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
      throw new Error("User creation did not return a record.");
    }

    return mapUserRow(row);
  }

  async updateProfile(
    id: string,
    data: UpdateUserProfileData,
  ): Promise<User | null> {
    const result = await this.pool
      .request()
      .input("id", mssql.UniqueIdentifier, id)
      .input("username", mssql.NVarChar(50), data.username)
      .input("email", mssql.NVarChar(254), data.email).query<UserRow>(`
        UPDATE dbo.Users
        SET
          Username = @username,
          Email = @email,
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          ${insertedUserColumns}
        WHERE Id = @id;
      `);

    const row = result.recordset[0];

    return row ? mapUserRow(row) : null;
  }

  async updateActiveStatus(
    id: string,
    isActive: boolean,
  ): Promise<User | null> {
    const result = await this.pool
      .request()
      .input("id", mssql.UniqueIdentifier, id)
      .input("isActive", mssql.Bit, isActive).query<UserRow>(`
        UPDATE dbo.Users
        SET
          IsActive = @isActive,
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          ${insertedUserColumns}
        WHERE Id = @id;
      `);

    const row = result.recordset[0];

    return row ? mapUserRow(row) : null;
  }
}
