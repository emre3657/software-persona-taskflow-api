IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        Id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_Users_Id DEFAULT NEWSEQUENTIALID(),

        Username NVARCHAR(50) NOT NULL,
        Email NVARCHAR(254) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,

        Role NVARCHAR(20) NOT NULL
            CONSTRAINT DF_Users_Role DEFAULT N'user',

        IsActive BIT NOT NULL
            CONSTRAINT DF_Users_IsActive DEFAULT 1,

        CreatedAt DATETIME2(3) NOT NULL
            CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),

        UpdatedAt DATETIME2(3) NOT NULL
            CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Users
            PRIMARY KEY CLUSTERED (Id),

        CONSTRAINT UQ_Users_Username
            UNIQUE (Username),

        CONSTRAINT UQ_Users_Email
            UNIQUE (Email),

        CONSTRAINT CK_Users_Role
            CHECK (Role IN (N'user', N'admin'))
    );
END;