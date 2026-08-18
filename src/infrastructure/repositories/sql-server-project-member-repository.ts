import mssql from "mssql";
import type {
  AddProjectMemberData,
  ProjectMemberDetails,
  ProjectMemberRepository,
} from "../../domain/repositories/project-member-repository.js";
import type {
  ProjectMember,
  ProjectRole,
} from "../../domain/entities/project-member.js";
import { connectToDatabase } from "../database/sql-server.js";

interface ProjectMemberRow {
  ProjectId: string;
  UserId: string;
  ProjectRole: ProjectRole;
  JoinedAt: Date;
}

interface ProjectMemberDetailsRow extends ProjectMemberRow {
  Username: string;
  Email: string;
}

function mapProjectMember(row: ProjectMemberRow): ProjectMember {
  return {
    projectId: row.ProjectId,
    userId: row.UserId,
    projectRole: row.ProjectRole,
    joinedAt: row.JoinedAt,
  };
}

function mapProjectMemberDetails(
  row: ProjectMemberDetailsRow,
): ProjectMemberDetails {
  return {
    ...mapProjectMember(row),
    username: row.Username,
    email: row.Email,
  };
}

export class SqlServerProjectMemberRepository implements ProjectMemberRepository {
  async findRole(
    projectId: string,
    userId: string,
  ): Promise<ProjectRole | null> {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("projectId", mssql.UniqueIdentifier, projectId)
      .input("userId", mssql.UniqueIdentifier, userId).query<{
      ProjectRole: ProjectRole;
    }>(`
        SELECT ProjectRole
        FROM dbo.ProjectMembers
        WHERE ProjectId = @projectId
          AND UserId = @userId;
      `);

    return result.recordset[0]?.ProjectRole ?? null;
  }

  async findAll(projectId: string): Promise<ProjectMemberDetails[]> {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("projectId", mssql.UniqueIdentifier, projectId)
      .query<ProjectMemberDetailsRow>(`
        SELECT
          pm.ProjectId,
          pm.UserId,
          pm.ProjectRole,
          pm.JoinedAt,
          u.Username,
          u.Email
        FROM dbo.ProjectMembers AS pm
        INNER JOIN dbo.Users AS u
          ON u.Id = pm.UserId
        WHERE pm.ProjectId = @projectId
        ORDER BY pm.JoinedAt ASC;
      `);

    return result.recordset.map(mapProjectMemberDetails);
  }

  async add(data: AddProjectMemberData): Promise<ProjectMember> {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("projectId", mssql.UniqueIdentifier, data.projectId)
      .input("userId", mssql.UniqueIdentifier, data.userId)
      .input("projectRole", mssql.NVarChar(20), data.projectRole)
      .query<ProjectMemberRow>(`
        INSERT INTO dbo.ProjectMembers
        (
          ProjectId,
          UserId,
          ProjectRole
        )
        OUTPUT
          inserted.ProjectId,
          inserted.UserId,
          inserted.ProjectRole,
          inserted.JoinedAt
        VALUES
        (
          @projectId,
          @userId,
          @projectRole
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Project member could not be created.");
    }

    return mapProjectMember(row);
  }

  async remove(projectId: string, userId: string): Promise<boolean> {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("projectId", mssql.UniqueIdentifier, projectId)
      .input("userId", mssql.UniqueIdentifier, userId).query(`
        DELETE FROM dbo.ProjectMembers
        WHERE ProjectId = @projectId
          AND UserId = @userId;
      `);

    return (result.rowsAffected[0] ?? 0) > 0;
  }

  async countManagers(projectId: string): Promise<number> {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("projectId", mssql.UniqueIdentifier, projectId).query<{
      ManagerCount: number;
    }>(`
        SELECT COUNT(*) AS ManagerCount
        FROM dbo.ProjectMembers
        WHERE ProjectId = @projectId
          AND ProjectRole = N'manager';
      `);

    return result.recordset[0]?.ManagerCount ?? 0;
  }

  async hasAssignedTasks(projectId: string, userId: string): Promise<boolean> {
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("projectId", mssql.UniqueIdentifier, projectId)
      .input("userId", mssql.UniqueIdentifier, userId).query<{
      ExistsValue: number;
    }>(`
        SELECT TOP (1) 1 AS ExistsValue
        FROM dbo.Tasks
        WHERE ProjectId = @projectId
          AND AssignedToUserId = @userId;
      `);

    return result.recordset.length > 0;
  }
}
