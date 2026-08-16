IF OBJECT_ID(N'dbo.ProjectMembers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProjectMembers
    (
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        UserId UNIQUEIDENTIFIER NOT NULL,

        ProjectRole NVARCHAR(20) NOT NULL
            CONSTRAINT DF_ProjectMembers_ProjectRole
            DEFAULT N'member',

        JoinedAt DATETIME2(3) NOT NULL
            CONSTRAINT DF_ProjectMembers_JoinedAt
            DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_ProjectMembers
            PRIMARY KEY CLUSTERED (ProjectId, UserId),

        CONSTRAINT FK_ProjectMembers_Projects_ProjectId
            FOREIGN KEY (ProjectId)
            REFERENCES dbo.Projects (Id)
            ON DELETE CASCADE,

        CONSTRAINT FK_ProjectMembers_Users_UserId
            FOREIGN KEY (UserId)
            REFERENCES dbo.Users (Id),

        CONSTRAINT CK_ProjectMembers_ProjectRole
            CHECK (
                ProjectRole IN (
                    N'manager',
                    N'member'
                )
            )
    );

    CREATE INDEX IX_ProjectMembers_UserId_ProjectId
        ON dbo.ProjectMembers (UserId, ProjectId);
END;