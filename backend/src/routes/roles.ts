import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

export const roleRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;

  // GET /api/roles - List all roles
  fastify.get('/', async (request, reply) => {
    try {
      const roles = await prisma.role.findMany({
        orderBy: {
          name: 'asc'
        }
      });
      return roles;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch roles' });
    }
  });

  // GET /api/roles/:id - Get a specific role
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const role = await prisma.role.findUnique({
        where: { id }
      });

      if (!role) {
        reply.status(404).send({ error: 'Role not found' });
        return;
      }

      return role;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch role' });
    }
  });

  // POST /api/roles - Create a new role
  fastify.post<{
    Body: {
      name: string;
      description: string;
    }
  }>('/', async (request, reply) => {
    try {
      const { name, description } = request.body;

      const role = await prisma.role.create({
        data: {
          name,
          description
        }
      });

      return role;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create role' });
    }
  });

  // PUT /api/roles/:id - Update a role
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      description?: string;
    }
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const role = await prisma.role.update({
        where: { id },
        data: updateData
      });

      return role;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update role' });
    }
  });

  // DELETE /api/roles/:id - Delete a role
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      await prisma.role.delete({
        where: { id }
      });

      reply.status(204).send();
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to delete role' });
    }
  });
};