import mssql from "mssql";

import type {
  CreateRefreshTokenData,
  RefreshTokenInvalidationReason,
  RefreshTokenRepository,
  RotateRefreshTokenData,
} from "../../domain/repositories/refresh-token-repository.js";

import type { RefreshToken } from "../../domain/entities/refresh-token.js";

interface RefreshTokenRow {
  Id: string;
  UserId: string;
  TokenFamilyId: string;
  TokenHash: string;
  ReplacedByTokenId: string | null;
  RevokedAt: Date | null;
  RevokeReason: RefreshToken["revokeReason"];
  ExpiresAt: Date;
  CreatedAt: Date;
}

interface CurrentTokenRow {
  UserId: string;
  TokenFamilyId: string;
}

function mapRefreshTokenRow(row: RefreshTokenRow): RefreshToken {
  return {
    id: row.Id,
    userId: row.UserId,
    tokenFamilyId: row.TokenFamilyId,
    tokenHash: row.TokenHash,
    replacedByTokenId: row.ReplacedByTokenId,
    revokedAt: row.RevokedAt,
    revokeReason: row.RevokeReason,
    expiresAt: row.ExpiresAt,
    createdAt: row.CreatedAt,
  };
}

const refreshTokenColumns = `
    Id,
    UserId,
    TokenFamilyId,
    TokenHash,
    ReplacedByTokenId,
    RevokedAt,
    RevokeReason,
    ExpiresAt,
    CreatedAt
`;

export class SqlServerRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly pool: mssql.ConnectionPool) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const result = await this.pool
      .request()
      .input("tokenHash", mssql.Char(64), tokenHash).query<RefreshTokenRow>(`
        SELECT ${refreshTokenColumns}
        FROM dbo.RefreshTokens
        WHERE TokenHash = @tokenHash;
      `);

    const row = result.recordset[0];

    return row ? mapRefreshTokenRow(row) : null;
  }

  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    const result = await this.pool
      .request()
      .input("userId", mssql.UniqueIdentifier, data.userId)
      .input("tokenFamilyId", mssql.UniqueIdentifier, data.tokenFamilyId)
      .input("tokenHash", mssql.Char(64), data.tokenHash)
      .input("expiresAt", mssql.DateTime2(3), data.expiresAt)
      .query<RefreshTokenRow>(`
        INSERT INTO dbo.RefreshTokens
        (
          UserId,
          TokenFamilyId,
          TokenHash,
          ExpiresAt
        )
        OUTPUT
          INSERTED.Id,
          INSERTED.UserId,
          INSERTED.TokenFamilyId,
          INSERTED.TokenHash,
          INSERTED.ReplacedByTokenId,
          INSERTED.RevokedAt,
          INSERTED.RevokeReason,
          INSERTED.ExpiresAt,
          INSERTED.CreatedAt
        VALUES
        (
          @userId,
          @tokenFamilyId,
          @tokenHash,
          @expiresAt
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Refresh token creation did not return a record");
    }

    return mapRefreshTokenRow(row);
  }

  async rotate(
    currentTokenId: string,
    data: RotateRefreshTokenData,
  ): Promise<RefreshToken | null> {
    const transaction = new mssql.Transaction(this.pool);

    await transaction.begin(mssql.ISOLATION_LEVEL.READ_COMMITTED);

    try {
      const currentResult = await new mssql.Request(transaction).input(
        "currentTokenId",
        mssql.UniqueIdentifier,
        currentTokenId,
      ).query<CurrentTokenRow>(`
            SELECT
              UserId,
              TokenFamilyId
            FROM dbo.RefreshTokens WITH (UPDLOCK, ROWLOCK)
            WHERE Id = @currentTokenId
              AND RevokedAt IS NULL;
          `);

      const currentToken = currentResult.recordset[0];

      if (!currentToken) {
        await transaction.commit();
        return null;
      }

      const newTokenResult = await new mssql.Request(transaction)
        .input("userId", mssql.UniqueIdentifier, currentToken.UserId)
        .input(
          "tokenFamilyId",
          mssql.UniqueIdentifier,
          currentToken.TokenFamilyId,
        )
        .input("tokenHash", mssql.Char(64), data.tokenHash)
        .input("expiresAt", mssql.DateTime2(3), data.expiresAt)
        .query<RefreshTokenRow>(`
            INSERT INTO dbo.RefreshTokens
            (
              UserId,
              TokenFamilyId,
              TokenHash,
              ExpiresAt
            )
            OUTPUT
              INSERTED.Id,
              INSERTED.UserId,
              INSERTED.TokenFamilyId,
              INSERTED.TokenHash,
              INSERTED.ReplacedByTokenId,
              INSERTED.RevokedAt,
              INSERTED.RevokeReason,
              INSERTED.ExpiresAt,
              INSERTED.CreatedAt
            VALUES
            (
              @userId,
              @tokenFamilyId,
              @tokenHash,
              @expiresAt
            );
          `);

      const newToken = newTokenResult.recordset[0];

      if (!newToken) {
        throw new Error("Refresh token rotation did not return a record");
      }

      await new mssql.Request(transaction)
        .input("currentTokenId", mssql.UniqueIdentifier, currentTokenId)
        .input("replacedByTokenId", mssql.UniqueIdentifier, newToken.Id).query(`
          UPDATE dbo.RefreshTokens
          SET
            ReplacedByTokenId = @replacedByTokenId,
            RevokedAt = SYSUTCDATETIME(),
            RevokeReason = N'rotated'
          WHERE Id = @currentTokenId;
        `);

      await transaction.commit();

      return mapRefreshTokenRow(newToken);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async revokeById(
    id: string,
    reason: RefreshTokenInvalidationReason,
  ): Promise<boolean> {
    const result = await this.pool
      .request()
      .input("id", mssql.UniqueIdentifier, id)
      .input("reason", mssql.NVarChar(30), reason).query(`
        UPDATE dbo.RefreshTokens
        SET
          RevokedAt = SYSUTCDATETIME(),
          RevokeReason = @reason
        WHERE Id = @id
          AND RevokedAt IS NULL;
      `);

    return (result.rowsAffected[0] ?? 0) > 0;
  }

  async revokeActiveByFamily(
    tokenFamilyId: string,
    reason: RefreshTokenInvalidationReason,
  ): Promise<number> {
    const result = await this.pool
      .request()
      .input("tokenFamilyId", mssql.UniqueIdentifier, tokenFamilyId)
      .input("reason", mssql.NVarChar(30), reason).query(`
        UPDATE dbo.RefreshTokens
        SET
          RevokedAt = SYSUTCDATETIME(),
          RevokeReason = @reason
        WHERE TokenFamilyId = @tokenFamilyId
          AND RevokedAt IS NULL;
      `);

    return result.rowsAffected[0] ?? 0;
  }

  async revokeActiveByUser(
    userId: string,
    reason: RefreshTokenInvalidationReason,
  ): Promise<number> {
    const result = await this.pool
      .request()
      .input("userId", mssql.UniqueIdentifier, userId)
      .input("reason", mssql.NVarChar(30), reason).query(`
        UPDATE dbo.RefreshTokens
        SET
          RevokedAt = SYSUTCDATETIME(),
          RevokeReason = @reason
        WHERE UserId = @userId
          AND RevokedAt IS NULL;
      `);

    return result.rowsAffected[0] ?? 0;
  }
}
