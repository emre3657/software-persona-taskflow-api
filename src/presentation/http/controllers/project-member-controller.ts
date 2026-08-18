import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

import type { AddProjectMember } from "../../../application/use-cases/project-members/add-project-member.js";
import type { ListProjectMembers } from "../../../application/use-cases/project-members/list-project-members.js";
import type { RemoveProjectMember } from "../../../application/use-cases/project-members/remove-project-member.js";

import {
  addProjectMemberBodySchema,
  projectMemberParamsSchema,
} from "../validation/project-member-schemas.js";
import { projectIdParamsSchema } from "../validation/project-schemas.js";

export class ProjectMemberController {
  constructor(
    private readonly addProjectMember: AddProjectMember,
    private readonly listProjectMembers: ListProjectMembers,
    private readonly removeProjectMember: RemoveProjectMember,
  ) {}

  readonly list: RequestHandler = async (req, res): Promise<void> => {
    const params = projectIdParamsSchema.parse(req.params);

    const members = await this.listProjectMembers.execute({
      projectId: params.projectId,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(StatusCodes.OK).json({
      data: members,
    });
  };

  readonly add: RequestHandler = async (req, res): Promise<void> => {
    const params = projectIdParamsSchema.parse(req.params);
    const body = addProjectMemberBodySchema.parse(req.body);

    const member = await this.addProjectMember.execute({
      projectId: params.projectId,
      requesterId: req.user!.id,
      requesterRole: req.user!.role,
      userId: body.userId,
      projectRole: body.projectRole,
    });

    res.status(StatusCodes.CREATED).json({
      data: member,
    });
  };

  readonly remove: RequestHandler = async (req, res): Promise<void> => {
    const params = projectMemberParamsSchema.parse(req.params);

    await this.removeProjectMember.execute({
      projectId: params.projectId,
      requesterId: req.user!.id,
      requesterRole: req.user!.role,
      userId: params.userId,
    });

    res.status(StatusCodes.NO_CONTENT).send();
  };
}
