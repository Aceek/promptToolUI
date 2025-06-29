import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  compositionIdParamSchema,
  createCompositionBodySchema,
  updateCompositionBodySchema,
  CompositionIdParam,
  CreateCompositionBody,
  UpdateCompositionBody,
} from '../schemas/composition.schema';

export const compositionsRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;

  // GET /api/compositions - Récupérer toutes les compositions
  fastify.get('/', async (request, reply) => {
    try {
      const compositions = await prisma.promptComposition.findMany({
        include: {
          blocks: {
            include: {
              block: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      fastify.appLogger.business({
        action: 'Compositions Listed',
        details: `${compositions.length} compositions retrieved`,
        resourceId: 'all'
      });

      return compositions;
    } catch (error) {
      fastify.appLogger.error(`Failed to fetch compositions: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch compositions' });
    }
  });

  // GET /api/compositions/:id - Récupérer une composition spécifique
  fastify.get<{ Params: CompositionIdParam }>('/:id', { schema: { params: compositionIdParamSchema } }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      const composition = await prisma.promptComposition.findUnique({
        where: { id },
        include: {
          blocks: {
            include: {
              block: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      if (!composition) {
        return reply.status(404).send({ error: 'Composition not found' });
      }

      fastify.appLogger.business({
        action: 'Composition Retrieved',
        details: `composition "${composition.name}"`,
        resourceId: composition.id
      });

      return composition;
    } catch (error) {
      fastify.appLogger.error(`Failed to fetch composition ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch composition' });
    }
  });

  // POST /api/compositions - Créer une nouvelle composition
  fastify.post<{ Body: CreateCompositionBody }>('/', { schema: { body: createCompositionBodySchema } }, async (request, reply) => {
    try {
      const { name, blockIds } = request.body;

      // Vérifier l'unicité du nom
      const existingByName = await prisma.promptComposition.findUnique({
        where: { name }
      });
      if (existingByName) {
        return reply.status(409).send({
          error: "Une composition avec ce nom existe déjà."
        });
      }

      // Vérifier que tous les blocs existent
      const existingBlocks = await prisma.promptBlock.findMany({
        where: { id: { in: blockIds } }
      });

      if (existingBlocks.length !== blockIds.length) {
        return reply.status(400).send({ error: 'Some blocks do not exist' });
      }

      // Créer la composition avec les blocs dans l'ordre
      const composition = await prisma.promptComposition.create({
        data: {
          name,
          blocks: {
            create: blockIds.map((blockId, index) => ({
              blockId,
              order: index
            }))
          }
        },
        include: {
          blocks: {
            include: {
              block: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      fastify.appLogger.business({
        action: 'Composition Created',
        details: `composition "${composition.name}" with ${blockIds.length} blocks`,
        resourceId: composition.id
      });

      return composition;
    } catch (error) {
      fastify.appLogger.error(`Failed to create composition: ${error}`);
      return reply.status(500).send({ error: 'Failed to create composition' });
    }
  });

  // PUT /api/compositions/:id - Mettre à jour une composition
  fastify.put<{
    Params: CompositionIdParam;
    Body: UpdateCompositionBody
  }>('/:id', {
    schema: {
      params: compositionIdParamSchema,
      body: updateCompositionBodySchema
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, blockIds } = request.body;

      const existingComposition = await prisma.promptComposition.findUnique({
        where: { id }
      });

      if (!existingComposition) {
        return reply.status(404).send({ error: 'Composition not found' });
      }

      // Vérifier l'unicité du nom si fourni
      if (name) {
        const existingByName = await prisma.promptComposition.findUnique({
          where: { name }
        });
        if (existingByName && existingByName.id !== id) {
          return reply.status(409).send({
            error: "Une composition avec ce nom existe déjà."
          });
        }
      }

      // Si blockIds est fourni, vérifier que tous les blocs existent
      if (blockIds && Array.isArray(blockIds)) {
        const existingBlocks = await prisma.promptBlock.findMany({
          where: { id: { in: blockIds } }
        });

        if (existingBlocks.length !== blockIds.length) {
          return reply.status(400).send({ error: 'Some blocks do not exist' });
        }
      }

      // Mettre à jour la composition
      const updatedComposition = await prisma.$transaction(async (tx) => {
        // Mettre à jour le nom si fourni
        const composition = await tx.promptComposition.update({
          where: { id },
          data: {
            ...(name !== undefined && { name })
          }
        });

        // Si blockIds est fourni, recréer les relations
        if (blockIds && Array.isArray(blockIds)) {
          // Supprimer les anciennes relations
          await tx.promptCompositionBlocks.deleteMany({
            where: { compositionId: id }
          });

          // Créer les nouvelles relations
          await tx.promptCompositionBlocks.createMany({
            data: blockIds.map((blockId, index) => ({
              compositionId: id,
              blockId,
              order: index
            }))
          });
        }

        // Retourner la composition mise à jour avec les blocs
        return await tx.promptComposition.findUnique({
          where: { id },
          include: {
            blocks: {
              include: {
                block: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        });
      });

      fastify.appLogger.business({
        action: 'Composition Updated',
        details: `composition "${updatedComposition?.name}"`,
        resourceId: id
      });

      return updatedComposition;
    } catch (error) {
      fastify.appLogger.error(`Failed to update composition ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to update composition' });
    }
  });

  // DELETE /api/compositions/:id - Supprimer une composition
  fastify.delete<{ Params: CompositionIdParam }>('/:id', { schema: { params: compositionIdParamSchema } }, async (request, reply) => {
    try {
      const { id } = request.params;

      const existingComposition = await prisma.promptComposition.findUnique({
        where: { id }
      });

      if (!existingComposition) {
        return reply.status(404).send({ error: 'Composition not found' });
      }

      await prisma.promptComposition.delete({
        where: { id }
      });

      fastify.appLogger.business({
        action: 'Composition Deleted',
        details: `composition "${existingComposition.name}"`,
        resourceId: existingComposition.id
      });

      return { message: 'Composition deleted successfully' };
    } catch (error) {
      fastify.appLogger.error(`Failed to delete composition ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to delete composition' });
    }
  });
};