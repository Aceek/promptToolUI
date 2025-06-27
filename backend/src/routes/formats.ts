import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

export const formatRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;

  // GET /api/formats - List all formats
  fastify.get('/', async (request, reply) => {
    try {
      const formats = await prisma.format.findMany({
        orderBy: {
          name: 'asc'
        }
      });
      return formats;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch formats' });
    }
  });

  // GET /api/formats/:id - Get a specific format
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const format = await prisma.format.findUnique({
        where: { id }
      });

      if (!format) {
        reply.status(404).send({ error: 'Format not found' });
        return;
      }

      return format;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch format' });
    }
  });

  // POST /api/formats - Create a new format
  fastify.post<{
    Body: {
      name: string;
      instructions: string;
      examples: string;
    }
  }>('/', async (request, reply) => {
    try {
      const { name, instructions, examples } = request.body;

      const format = await prisma.format.create({
        data: {
          name,
          instructions,
          examples
        }
      });

      return format;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create format' });
    }
  });

  // PUT /api/formats/:id - Update a format
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      instructions?: string;
      examples?: string;
    }
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const format = await prisma.format.update({
        where: { id },
        data: updateData
      });

      return format;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update format' });
    }
  });

  // DELETE /api/formats/:id - Delete a format
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      await prisma.format.delete({
        where: { id }
      });

      reply.status(204).send();
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to delete format' });
    }
  });
};