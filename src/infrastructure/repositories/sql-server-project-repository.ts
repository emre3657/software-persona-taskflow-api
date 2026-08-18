import mssql from "mssql";

import type {
  CreateProjectData,
  ProjectRepository,
  ProjectWithRole,
  UpdateProjectData,
} from "../../domain/repositories/project-repository.js";

import type { Project } from "../../domain/entities/project.js";
import type { ProjectRole } from "../../domain/entities/project-member.js";

interface ProjectRow {
  Id: string;
  Name: string;
  Description: string | null;
  CreatedByUserId: string;
  CreatedAt: Date;
  UpdatedAt: Date;
}

interface ProjectWithRoleRow extends ProjectRow {
  CurrentUserRole: ProjectRole;
}

function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.Id,
    name: row.Name,
    description: row.Description,
    createdByUserId: row.CreatedByUserId,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

function mapProjectWithRoleRow(row: ProjectWithRoleRow): ProjectWithRole {
  return {
    ...mapProjectRow(row),
    currentUserRole: row.CurrentUserRole,
  };
}

const projectColumns = `
  p.Id,
  p.Name,
  p.Description,
  p.CreatedByUserId,
  p.CreatedAt,
  p.UpdatedAt
`;

export class SqlServerProjectRepository implements ProjectRepository {
  constructor(private readonly pool: mssql.ConnectionPool) {}

  async createWithManager(data: CreateProjectData): Promise<Project> {
    const transaction = new mssql.Transaction(this.pool);

    await transaction.begin(mssql.ISOLATION_LEVEL.READ_COMMITTED);

    try {
      const projectResult = await new mssql.Request(transaction)
        .input("name", mssql.NVarChar(200), data.name)
        .input("description", mssql.NVarChar(2000), data.description)
        .input("createdByUserId", mssql.UniqueIdentifier, data.createdByUserId)
        .query<ProjectRow>(`
            INSERT INTO dbo.Projects
            (
              Name,
              Description,
              CreatedByUserId
            )
            OUTPUT
              INSERTED.Id,
              INSERTED.Name,
              INSERTED.Description,
              INSERTED.CreatedByUserId,
              INSERTED.CreatedAt,
              INSERTED.UpdatedAt
            VALUES
            (
              @name,
              @description,
              @createdByUserId
            );
          `);

      const projectRow = projectResult.recordset[0];

      if (!projectRow) {
        throw new Error("Project creation did not return a record");
      }

      await new mssql.Request(transaction)
        .input("projectId", mssql.UniqueIdentifier, projectRow.Id)
        .input("userId", mssql.UniqueIdentifier, data.createdByUserId).query(`
          INSERT INTO dbo.ProjectMembers
          (
            ProjectId,
            UserId,
            ProjectRole
          )
          VALUES
          (
            @projectId,
            @userId,
            N'manager'
          );
        `);

      await transaction.commit();

      return mapProjectRow(projectRow);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findById(id: string): Promise<Project | null> {
    const result = await this.pool
      .request()
      .input("id", mssql.UniqueIdentifier, id).query<ProjectRow>(`
        SELECT
          ${projectColumns}
        FROM dbo.Projects AS p
        WHERE p.Id = @id;
      `);

    const row = result.recordset[0];

    return row ? mapProjectRow(row) : null;
  }

  async findByIdForUser(
    projectId: string,
    userId: string,
  ): Promise<ProjectWithRole | null> {
    const result = await this.pool
      .request()
      .input("projectId", mssql.UniqueIdentifier, projectId)
      .input("userId", mssql.UniqueIdentifier, userId)
      .query<ProjectWithRoleRow>(`
        SELECT
          ${projectColumns},
          pm.ProjectRole AS CurrentUserRole
        FROM dbo.Projects AS p
        INNER JOIN dbo.ProjectMembers AS pm
          ON pm.ProjectId = p.Id
        WHERE p.Id = @projectId
          AND pm.UserId = @userId;
      `);

    const row = result.recordset[0];

    return row ? mapProjectWithRoleRow(row) : null;
  }

  async findAllForUser(userId: string): Promise<ProjectWithRole[]> {
    const result = await this.pool
      .request()
      .input("userId", mssql.UniqueIdentifier, userId)
      .query<ProjectWithRoleRow>(`
        SELECT
          ${projectColumns},
          pm.ProjectRole AS CurrentUserRole
        FROM dbo.Projects AS p
        INNER JOIN dbo.ProjectMembers AS pm
          ON pm.ProjectId = p.Id
        WHERE pm.UserId = @userId
        ORDER BY p.CreatedAt DESC;
      `);

    return result.recordset.map(mapProjectWithRoleRow);
  }

  async update(id: string, data: UpdateProjectData): Promise<Project | null> {
    const result = await this.pool
      .request()
      .input("id", mssql.UniqueIdentifier, id)
      .input("name", mssql.NVarChar(200), data.name)
      .input("description", mssql.NVarChar(2000), data.description)
      .query<ProjectRow>(`
        UPDATE dbo.Projects
        SET
          Name = @name,
          Description = @description,
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id,
          INSERTED.Name,
          INSERTED.Description,
          INSERTED.CreatedByUserId,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE Id = @id;
      `);

    const row = result.recordset[0];

    return row ? mapProjectRow(row) : null;
  }

  async hasTasks(id: string): Promise<boolean> {
    const result = await this.pool
      .request()
      .input("id", mssql.UniqueIdentifier, id).query<{ Id: string }>(`
        SELECT TOP (1)
          Id
        FROM dbo.Tasks
        WHERE ProjectId = @id;
      `);

    return result.recordset.length > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool
      .request()
      .input("id", mssql.UniqueIdentifier, id).query(`
        DELETE FROM dbo.Projects
        WHERE Id = @id;
      `);

    return (result.rowsAffected[0] ?? 0) > 0;
  }
}
