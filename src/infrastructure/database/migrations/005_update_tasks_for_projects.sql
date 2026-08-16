-- Remove the old UserId foreign key and indexes
ALTER TABLE dbo.Tasks
    DROP CONSTRAINT FK_Tasks_Users_UserId;

DROP INDEX IX_Tasks_UserId_CreatedAt
    ON dbo.Tasks;

DROP INDEX IX_Tasks_UserId_Status
    ON dbo.Tasks;

-- UserId will now represent the user who created the task
EXEC sp_rename
    N'dbo.Tasks.UserId',
    N'CreatedByUserId',
    N'COLUMN';

-- Add the new relationship columns
ALTER TABLE dbo.Tasks
ADD
    ProjectId UNIQUEIDENTIFIER NULL,
    AssignedToUserId UNIQUEIDENTIFIER NULL;

-- ProjectId can be made required because the table is currently empty
IF EXISTS (SELECT 1 FROM dbo.Tasks)
BEGIN
    THROW 50001,
        N'Existing tasks must be assigned to a project before migration.',
        1;
END;

-- Compile statements that use the new columns after those columns exist
EXEC sys.sp_executesql N'
    ALTER TABLE dbo.Tasks
        ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;

    -- The project that the task belongs to
    ALTER TABLE dbo.Tasks
    ADD CONSTRAINT FK_Tasks_Projects_ProjectId
        FOREIGN KEY (ProjectId)
        REFERENCES dbo.Projects (Id);

    -- The user who created the task
    ALTER TABLE dbo.Tasks
    ADD CONSTRAINT FK_Tasks_Users_CreatedByUserId
        FOREIGN KEY (CreatedByUserId)
        REFERENCES dbo.Users (Id);

    -- Ensure that the assigned user is a member of the related project
    ALTER TABLE dbo.Tasks
    ADD CONSTRAINT FK_Tasks_ProjectMembers_Assignee
        FOREIGN KEY (ProjectId, AssignedToUserId)
        REFERENCES dbo.ProjectMembers (ProjectId, UserId);

    -- Support listing project tasks by creation date
    CREATE INDEX IX_Tasks_ProjectId_CreatedAt
        ON dbo.Tasks (ProjectId, CreatedAt DESC);

    -- Support filtering project tasks by status
    CREATE INDEX IX_Tasks_ProjectId_Status
        ON dbo.Tasks (ProjectId, Status);

    -- Support filtering tasks assigned to a specific user
    CREATE INDEX IX_Tasks_AssignedToUserId_Status
        ON dbo.Tasks (AssignedToUserId, Status)
        WHERE AssignedToUserId IS NOT NULL;
';