import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  workspaceIdParamSchema,
  createWorkspaceBodySchema,
  updateWorkspaceBodySchema,
  WorkspaceIdParam,
  CreateWorkspaceBody,
  UpdateWorkspaceBody,
} from '../schemas/workspace.schema';

export const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;

  // GET /api/workspaces - List all workspaces
  fastify.get('/', async (request, reply) => {
    try {
      const workspaces = await prisma.workspace.findMany({
        include: {
          defaultComposition: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
      return workspaces;
    } catch (error) {
      fastify.appLogger.error(`Failed to fetch workspaces: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch workspaces' });
    }
  });

  // GET /api/workspaces/:id - Get a specific workspace
  fastify.get<{ Params: WorkspaceIdParam }>('/:id', { schema: { params: workspaceIdParamSchema } }, async (request, reply) => {
    try {
      const { id } = request.params;
      const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
          defaultComposition: true
        }
      });

      if (!workspace) {
        reply.status(404).send({ error: 'Workspace not found' });
        return;
      }

      return workspace;
    } catch (error) {
      fastify.appLogger.error(`Failed to fetch workspace ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch workspace' });
    }
  });

  // POST /api/workspaces - Create a new workspace
  fastify.post<{ Body: CreateWorkspaceBody }>('/', { schema: { body: createWorkspaceBodySchema } }, async (request, reply) => {
    try {
      const {
        name,
        path,
        defaultCompositionId,
        ignorePatterns = [],
        projectInfo
      } = request.body;

      // Vérifier l'unicité du chemin
      const existingByPath = await prisma.workspace.findUnique({
        where: { path }
      });
      if (existingByPath) {
        return reply.status(409).send({
          error: "Un espace de travail avec ce chemin existe déjà."
        });
      }

      const data: any = {
        name,
        path,
        ignorePatterns,
        selectedFiles: [],
        projectInfo: projectInfo || null,
        defaultCompositionId: defaultCompositionId || null
      };

      const workspace = await prisma.workspace.create({
        data,
        include: {
          defaultComposition: true
        }
      });

      fastify.appLogger.business({
        action: 'Workspace Created',
        details: `"${name}" at ${path}`,
        resourceId: workspace.id
      });
      return workspace;
    } catch (error) {
      fastify.appLogger.error(`Failed to create workspace "${request.body.name}": ${error}`);
      return reply.status(500).send({ error: 'Failed to create workspace' });
    }
  });

  // PUT /api/workspaces/:id - Update a workspace
  fastify.put<{
    Params: WorkspaceIdParam;
    Body: UpdateWorkspaceBody;
  }>('/:id', {
    schema: {
      params: workspaceIdParamSchema,
      body: updateWorkspaceBodySchema
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData: any = { ...request.body };

      // Vérifier l'unicité du chemin si fourni
      if (updateData.path) {
        const existingByPath = await prisma.workspace.findUnique({
          where: { path: updateData.path }
        });
        if (existingByPath && existingByPath.id !== id) {
          return reply.status(409).send({
            error: "Un espace de travail avec ce chemin existe déjà."
          });
        }
      }

      // Convertir les undefined en null pour les champs optionnels
      if ('defaultCompositionId' in updateData && updateData.defaultCompositionId === undefined) {
        updateData.defaultCompositionId = null;
      }

      const workspace = await prisma.workspace.update({
        where: { id },
        data: updateData,
        include: {
          defaultComposition: true
        }
      });

      fastify.appLogger.business({
        action: 'Workspace Updated',
        resourceId: request.params.id
      });
      return workspace;
    } catch (error) {
      fastify.appLogger.error(`Failed to update workspace ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to update workspace' });
    }
  });

  // DELETE /api/workspaces/:id - Delete a workspace
  fastify.delete<{ Params: WorkspaceIdParam }>('/:id', { schema: { params: workspaceIdParamSchema } }, async (request, reply) => {
    try {
      const { id } = request.params;

      await prisma.workspace.delete({
        where: { id }
      });

      fastify.appLogger.business({
        action: 'Workspace Deleted',
        resourceId: request.params.id
      });
      return reply.status(204).send();
    } catch (error) {
      fastify.appLogger.error(`Failed to delete workspace ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to delete workspace' });
    }
  });

};
