import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

export const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;

  // GET /api/workspaces - List all workspaces
  fastify.get('/', async (request, reply) => {
    try {
      const workspaces = await prisma.workspace.findMany({
        include: {
          defaultFormat: true,
          defaultRole: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
      return workspaces;
    } catch (error) {
      fastify.log.error(error);
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
          defaultFormat: true,
          defaultRole: true
        }
      });

      if (!workspace) {
        reply.status(404).send({ error: 'Workspace not found' });
        return;
      }

      return workspace;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch workspace' });
    }
  });

  // POST /api/workspaces - Create a new workspace
  fastify.post<{
    Body: {
      name: string;
      path: string;
      defaultFormatId?: string;
      defaultRoleId?: string;
      ignorePatterns?: string[];
    }
  }>('/', async (request, reply) => {
    try {
      const { name, path, defaultFormatId, defaultRoleId, ignorePatterns = [] } = request.body;

      const data: any = {
        name,
        path,
        ignorePatterns,
        selectedFiles: []
      };

      if (defaultFormatId) {
        data.defaultFormatId = defaultFormatId;
      }
      if (defaultRoleId) {
        data.defaultRoleId = defaultRoleId;
      }

      const workspace = await prisma.workspace.create({
        data,
        include: {
          defaultFormat: true,
          defaultRole: true
        }
      });

      return workspace;
    } catch (error) {
      fastify.log.error(error);
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
      defaultFormatId?: string;
      defaultRoleId?: string;
      ignorePatterns?: string[];
    }
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const workspace = await prisma.workspace.update({
        where: { id },
        data: updateData,
        include: {
          defaultFormat: true,
          defaultRole: true
        }
      });

      return workspace;
    } catch (error) {
      fastify.log.error(error);
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

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete workspace' });
    }
  });
};