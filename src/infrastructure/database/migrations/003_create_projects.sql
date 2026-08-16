IF OBJECT_ID(N'dbo.Projects', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Projects
    (
        Id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_Projects_Id
            DEFAULT NEWSEQUENTIALID(),

        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(2000) NULL,

        CreatedByUserId UNIQUEIDENTIFIER NOT NULL,

        CreatedAt DATETIME2(3) NOT NULL
            CONSTRAINT DF_Projects_CreatedAt
            DEFAULT SYSUTCDATETIME(),

        UpdatedAt DATETIME2(3) NOT NULL
            CONSTRAINT DF_Projects_UpdatedAt
            DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Projects
            PRIMARY KEY CLUSTERED (Id),

        CONSTRAINT FK_Projects_Users_CreatedByUserId
            FOREIGN KEY (CreatedByUserId)
            REFERENCES dbo.Users (Id),

        CONSTRAINT CK_Projects_Name_NotEmpty
            CHECK (LEN(LTRIM(RTRIM(Name))) > 0)
    );

    CREATE INDEX IX_Projects_CreatedByUserId
        ON dbo.Projects (CreatedByUserId);
END;