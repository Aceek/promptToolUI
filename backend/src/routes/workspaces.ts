import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

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
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
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
  fastify.post<{
    Body: {
      name: string;
      path: string;
      defaultCompositionId?: string;
      ignorePatterns?: string[];
      projectInfo?: string;
    }
  }>('/', async (request, reply) => {
    try {
      const {
        name,
        path,
        defaultCompositionId,
        ignorePatterns = [],
        projectInfo
      } = request.body;

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
    Params: { id: string };
    Body: {
      name?: string;
      path?: string;
      selectedFiles?: string[];
      lastFinalRequest?: string;
      defaultCompositionId?: string | null;
      ignorePatterns?: string[];
      projectInfo?: string;
    }
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = { ...request.body };

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
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
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

  // GET /api/workspaces/:id/structure - Get workspace file structure
  fastify.get<{ Params: { id: string } }>('/:id/structure', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Vérifier que le workspace existe
      const workspace = await prisma.workspace.findUnique({
        where: { id }
      });

      if (!workspace) {
        return reply.status(404).send({ error: 'Workspace not found' });
      }

      // Appeler l'agent pour obtenir la structure
      const agentResponse = await fetch(`http://file-system-agent:4001/api/files/structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: workspace.path,
          ignorePatterns: workspace.ignorePatterns
        })
      });

      if (!agentResponse.ok) {
        throw new Error(`Agent responded with status ${agentResponse.status}`);
      }

      const structure = await agentResponse.json();
      return structure;
    } catch (error) {
      fastify.appLogger.error(`Failed to get workspace structure ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to get workspace structure' });
    }
  });
};
