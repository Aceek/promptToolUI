import { FastifyPluginAsync } from 'fastify';
import { workspaceController } from '../controllers/workspace.controller';
import {
  workspaceIdParamSchema,
  createWorkspaceBodySchema,
  updateWorkspaceBodySchema,
  WorkspaceIdParam,
  CreateWorkspaceBody,
  UpdateWorkspaceBody,
} from '../schemas/workspace.schema';

export const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/workspaces - List all workspaces
  fastify.get('/', workspaceController.getAllWorkspacesHandler.bind(workspaceController));

  // GET /api/workspaces/:id - Get a specific workspace
  fastify.get<{ Params: WorkspaceIdParam }>(
    '/:id',
    { schema: { params: workspaceIdParamSchema } },
    workspaceController.getWorkspaceByIdHandler.bind(workspaceController)
  );

  // POST /api/workspaces - Create a new workspace
  fastify.post<{ Body: CreateWorkspaceBody }>(
    '/',
    { schema: { body: createWorkspaceBodySchema } },
    workspaceController.createWorkspaceHandler.bind(workspaceController)
  );

  // PUT /api/workspaces/:id - Update a workspace
  fastify.put<{
    Params: WorkspaceIdParam;
    Body: UpdateWorkspaceBody;
  }>(
    '/:id',
    {
      schema: {
        params: workspaceIdParamSchema,
        body: updateWorkspaceBodySchema
      }
    },
    workspaceController.updateWorkspaceHandler.bind(workspaceController)
  );

  // DELETE /api/workspaces/:id - Delete a workspace
  fastify.delete<{ Params: WorkspaceIdParam }>(
    '/:id',
    { schema: { params: workspaceIdParamSchema } },
    workspaceController.deleteWorkspaceHandler.bind(workspaceController)
  );
};