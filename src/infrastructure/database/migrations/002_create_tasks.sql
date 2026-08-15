IF OBJECT_ID(N'dbo.Tasks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tasks
    (
        Id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_Tasks_Id DEFAULT NEWSEQUENTIALID(),

        UserId UNIQUEIDENTIFIER NOT NULL,

        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(2000) NULL,

        Status NVARCHAR(20) NOT NULL
            CONSTRAINT DF_Tasks_Status DEFAULT N'todo',

        Priority NVARCHAR(20) NOT NULL
            CONSTRAINT DF_Tasks_Priority DEFAULT N'medium',

        DueDate DATETIME2(3) NULL,
        CompletedAt DATETIME2(3) NULL,

        CreatedAt DATETIME2(3) NOT NULL
            CONSTRAINT DF_Tasks_CreatedAt DEFAULT SYSUTCDATETIME(),

        UpdatedAt DATETIME2(3) NOT NULL
            CONSTRAINT DF_Tasks_UpdatedAt DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Tasks
            PRIMARY KEY CLUSTERED (Id),

        CONSTRAINT FK_Tasks_Users_UserId
            FOREIGN KEY (UserId)
            REFERENCES dbo.Users (Id),

        CONSTRAINT CK_Tasks_Title_NotEmpty
            CHECK (LEN(LTRIM(RTRIM(Title))) > 0),

        CONSTRAINT CK_Tasks_Status
            CHECK (
                Status IN (
                    N'todo',
                    N'in_progress',
                    N'completed'
                )
            ),

        CONSTRAINT CK_Tasks_Priority
            CHECK (
                Priority IN (
                    N'low',
                    N'medium',
                    N'high'
                )
            ),

        CONSTRAINT CK_Tasks_Completion
            CHECK (
                (
                    Status = N'completed'
                    AND CompletedAt IS NOT NULL
                )
                OR
                (
                    Status <> N'completed'
                    AND CompletedAt IS NULL
                )
            )
    );

    CREATE INDEX IX_Tasks_UserId_CreatedAt
        ON dbo.Tasks (UserId, CreatedAt DESC);

    CREATE INDEX IX_Tasks_UserId_Status
        ON dbo.Tasks (UserId, Status);
END;