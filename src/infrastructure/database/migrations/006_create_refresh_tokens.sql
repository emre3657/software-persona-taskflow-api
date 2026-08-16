IF OBJECT_ID(N'dbo.RefreshTokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RefreshTokens
    (
        Id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_RefreshTokens_Id
            DEFAULT NEWSEQUENTIALID(),

        UserId UNIQUEIDENTIFIER NOT NULL,
        TokenFamilyId UNIQUEIDENTIFIER NOT NULL,

        TokenHash CHAR(64) NOT NULL,
        ReplacedByTokenId UNIQUEIDENTIFIER NULL,

        RevokedAt DATETIME2(3) NULL,
        RevokeReason NVARCHAR(30) NULL,

        ExpiresAt DATETIME2(3) NOT NULL,

        CreatedAt DATETIME2(3) NOT NULL
            CONSTRAINT DF_RefreshTokens_CreatedAt
            DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_RefreshTokens
            PRIMARY KEY CLUSTERED (Id),

        CONSTRAINT UQ_RefreshTokens_TokenHash
            UNIQUE (TokenHash),

        CONSTRAINT FK_RefreshTokens_Users_UserId
            FOREIGN KEY (UserId)
            REFERENCES dbo.Users (Id)
            ON DELETE CASCADE,

        CONSTRAINT FK_RefreshTokens_ReplacedByTokenId
            FOREIGN KEY (ReplacedByTokenId)
            REFERENCES dbo.RefreshTokens (Id),

        CONSTRAINT CK_RefreshTokens_Expiration
            CHECK (ExpiresAt > CreatedAt),

        CONSTRAINT CK_RefreshTokens_Revocation
            CHECK (
                (
                    RevokedAt IS NULL
                    AND RevokeReason IS NULL
                )
                OR
                (
                    RevokedAt IS NOT NULL
                    AND RevokeReason IS NOT NULL
                )
            ),

        CONSTRAINT CK_RefreshTokens_RevokeReason
            CHECK (
                RevokeReason IS NULL
                OR RevokeReason IN (
                    N'rotated',
                    N'logout',
                    N'expired',
                    N'reuse_detected'
                )
            ),

        CONSTRAINT CK_RefreshTokens_Replacement
            CHECK (
                ReplacedByTokenId IS NULL
                OR RevokeReason = N'rotated'
            )
    );

    -- Support revoking or listing all active sessions of a user
    CREATE INDEX IX_RefreshTokens_UserId_RevokedAt
        ON dbo.RefreshTokens (UserId, RevokedAt);

    -- Support reuse detection within a token family
    CREATE INDEX IX_RefreshTokens_TokenFamilyId_RevokedAt
        ON dbo.RefreshTokens (TokenFamilyId, RevokedAt);

    -- Ensure that a refresh token replaces at most one previous token
    CREATE UNIQUE INDEX UX_RefreshTokens_ReplacedByTokenId
        ON dbo.RefreshTokens (ReplacedByTokenId)
        WHERE ReplacedByTokenId IS NOT NULL;
END;