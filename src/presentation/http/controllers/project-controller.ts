import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import type { CreateProject } from "../../../application/use-cases/projects/create-project.js";
import type { DeleteProject } from "../../../application/use-cases/projects/delete-project.js";
import type { GetProject } from "../../../application/use-cases/projects/get-project.js";
import type { ListProjects } from "../../../application/use-cases/projects/list-projects.js";
import type { UpdateProject } from "../../../application/use-cases/projects/update-project.js";
import {
  createProjectBodySchema,
  deleteProjectBodySchema,
  projectIdParamsSchema,
  updateProjectBodySchema,
} from "../validation/project-schemas.js";

export class ProjectController {
  constructor(
    private readonly createProject: CreateProject,
    private readonly listProjects: ListProjects,
    private readonly getProject: GetProject,
    private readonly updateProject: UpdateProject,
    private readonly deleteProject: DeleteProject,
  ) {}

  readonly create: RequestHandler = async (req, res): Promise<void> => {
    const body = createProjectBodySchema.parse(req.body);

    const project = await this.createProject.execute({
      userId: req.user!.id,
      name: body.name,
      description: body.description,
    });

    res.status(StatusCodes.CREATED).json({
      data: project,
    });
  };

  readonly list: RequestHandler = async (req, res): Promise<void> => {
    const projects = await this.listProjects.execute({
      userId: req.user!.id,
    });

    res.status(StatusCodes.OK).json({
      data: projects,
    });
  };

  readonly getById: RequestHandler = async (req, res): Promise<void> => {
    const params = projectIdParamsSchema.parse(req.params);

    const project = await this.getProject.execute({
      projectId: params.projectId,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(StatusCodes.OK).json({
      data: project,
    });
  };

  readonly update: RequestHandler = async (req, res): Promise<void> => {
    const params = projectIdParamsSchema.parse(req.params);
    const body = updateProjectBodySchema.parse(req.body);

    const project = await this.updateProject.execute({
      projectId: params.projectId,
      userId: req.user!.id,
      userRole: req.user!.role,
      name: body.name,
      description: body.description,
    });

    res.status(StatusCodes.OK).json({
      data: project,
    });
  };

  readonly delete: RequestHandler = async (req, res): Promise<void> => {
    const params = projectIdParamsSchema.parse(req.params);
    const body = deleteProjectBodySchema.parse(req.body);

    await this.deleteProject.execute({
      projectId: params.projectId,
      userId: req.user!.id,
      userRole: req.user!.role,
      password: body.password,
    });

    res.status(StatusCodes.NO_CONTENT).send();
  };
}
