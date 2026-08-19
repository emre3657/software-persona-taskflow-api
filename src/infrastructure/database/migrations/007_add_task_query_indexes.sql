-- Support filtering project tasks by priority
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Tasks_ProjectId_Priority'
      AND object_id = OBJECT_ID(N'dbo.Tasks')
)
BEGIN
    CREATE INDEX IX_Tasks_ProjectId_Priority
        ON dbo.Tasks (ProjectId, Priority);
END;

-- Support due date filtering, overdue queries, and due date sorting
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Tasks_ProjectId_DueDate'
      AND object_id = OBJECT_ID(N'dbo.Tasks')
)
BEGIN
    CREATE INDEX IX_Tasks_ProjectId_DueDate
        ON dbo.Tasks (ProjectId, DueDate)
        WHERE DueDate IS NOT NULL;
END;

-- Support filtering project tasks by their creator
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Tasks_ProjectId_CreatedByUserId'
      AND object_id = OBJECT_ID(N'dbo.Tasks')
)
BEGIN
    CREATE INDEX IX_Tasks_ProjectId_CreatedByUserId
        ON dbo.Tasks (ProjectId, CreatedByUserId);
END;

-- Support project-scoped assignee and status filters
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Tasks_ProjectId_AssignedToUserId_Status'
      AND object_id = OBJECT_ID(N'dbo.Tasks')
)
BEGIN
    CREATE INDEX IX_Tasks_ProjectId_AssignedToUserId_Status
        ON dbo.Tasks
        (
            ProjectId,
            AssignedToUserId,
            Status
        )
        WHERE AssignedToUserId IS NOT NULL;
END;