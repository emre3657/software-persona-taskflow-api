import type { RequestHandler, Router } from "express";
import type { ConnectionPool } from "mssql";

import { env } from "../config/env.js";

import { AddProjectMember } from "../application/use-cases/project-members/add-project-member.js";
import { ListProjectMembers } from "../application/use-cases/project-members/list-project-members.js";
import { RemoveProjectMember } from "../application/use-cases/project-members/remove-project-member.js";

import { CreateProject } from "../application/use-cases/projects/create-project.js";
import { DeleteProject } from "../application/use-cases/projects/delete-project.js";
import { GetProject } from "../application/use-cases/projects/get-project.js";
import { ListProjects } from "../application/use-cases/projects/list-projects.js";
import { UpdateProject } from "../application/use-cases/projects/update-project.js";

import { SqlServerProjectMemberRepository } from "../infrastructure/repositories/sql-server-project-member-repository.js";
import { SqlServerProjectRepository } from "../infrastructure/repositories/sql-server-project-repository.js";
import { SqlServerUserRepository } from "../infrastructure/repositories/sql-server-user-repository.js";
import { BcryptPasswordHasher } from "../infrastructure/security/bcrypt-password-hasher.js";

import { ProjectController } from "../presentation/http/controllers/project-controller.js";
import { ProjectMemberController } from "../presentation/http/controllers/project-member-controller.js";
import { createProjectRouter } from "../presentation/http/routes/project-routes.js";

export interface ProjectModule {
  router: Router;
}

export function createProjectModule(
  pool: ConnectionPool,
  authenticate: RequestHandler,
): ProjectModule {
  const projectRepository = new SqlServerProjectRepository(pool);

  const projectMemberRepository = new SqlServerProjectMemberRepository(pool);

  const userRepository = new SqlServerUserRepository(pool);

  const passwordHasher = new BcryptPasswordHasher(env.BCRYPT_SALT_ROUNDS);

  const createProject = new CreateProject(projectRepository);

  const listProjects = new ListProjects(projectRepository);

  const getProject = new GetProject(projectRepository);

  const updateProject = new UpdateProject(projectRepository);

  const deleteProject = new DeleteProject(
    projectRepository,
    userRepository,
    passwordHasher,
  );

  const addProjectMember = new AddProjectMember(
    projectRepository,
    projectMemberRepository,
    userRepository,
  );

  const listProjectMembers = new ListProjectMembers(
    projectRepository,
    projectMemberRepository,
  );

  const removeProjectMember = new RemoveProjectMember(
    projectRepository,
    projectMemberRepository,
  );

  const projectController = new ProjectController(
    createProject,
    listProjects,
    getProject,
    updateProject,
    deleteProject,
  );

  const projectMemberController = new ProjectMemberController(
    addProjectMember,
    listProjectMembers,
    removeProjectMember,
  );

  const router = createProjectRouter(
    projectController,
    projectMemberController,
    authenticate,
  );

  return {
    router,
  };
}
