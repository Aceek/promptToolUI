import { FastifyPluginAsync } from 'fastify';
import { PrismaClient, PromptBlockType } from '@prisma/client';

const SYSTEM_CATEGORY_NAME = 'Blocs Fondamentaux';

export const blocksRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;

  // GET /api/blocks - Récupérer tous les blocs
  fastify.get('/', async (request, reply) => {
    try {
      const blocks = await prisma.promptBlock.findMany({
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      fastify.appLogger.business({
        action: 'Blocks Listed',
        details: `${blocks.length} blocks retrieved`,
        resourceId: 'all'
      });

      return blocks;
    } catch (error) {
      fastify.appLogger.error(`Failed to fetch blocks: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch blocks' });
    }
  });

  // GET /api/blocks/:id - Récupérer un bloc spécifique
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const block = await prisma.promptBlock.findUnique({
        where: { id }
      });

      if (!block) {
        return reply.status(404).send({ error: 'Block not found' });
      }

      fastify.appLogger.business({
        action: 'Block Retrieved',
        details: `block "${block.name}"`,
        resourceId: block.id
      });

      return block;
    } catch (error) {
      fastify.appLogger.error(`Failed to fetch block ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch block' });
    }
  });

  // POST /api/blocks - Créer un nouveau bloc
  fastify.post<{
    Body: {
      name: string;
      content: string;
      type: PromptBlockType;
      category?: string;
      color?: string;
    }
  }>('/', async (request, reply) => {
    try {
      const { name, content, type, category, color } = request.body;

      // Validation basique
      if (!name || !content) {
        return reply.status(400).send({ error: 'Name and content are required' });
      }

      if (category?.trim() === SYSTEM_CATEGORY_NAME) {
        return reply.status(403).send({ error: `The category "${SYSTEM_CATEGORY_NAME}" is reserved for system blocks.` });
      }

      // Validation des couleurs réservées
      const SYSTEM_BLOCK_COLOR = '#8B5CF6';
      const DYNAMIC_TASK_BLOCK_COLOR = '#EF4444';
      const RESERVED_COLORS = [SYSTEM_BLOCK_COLOR, DYNAMIC_TASK_BLOCK_COLOR];
      if (color && RESERVED_COLORS.includes(color) && type !== PromptBlockType.DYNAMIC_TASK) {
        return reply.status(403).send({ error: 'This color is reserved for system blocks.' });
      }

      let dataToCreate: any = {
        name,
        content,
        type,
        category: category || null,
        color: color || null
      };

      if (type === PromptBlockType.DYNAMIC_TASK) {
        dataToCreate.category = SYSTEM_CATEGORY_NAME;
        dataToCreate.systemBehavior = 'SYSTEM';
        dataToCreate.color = DYNAMIC_TASK_BLOCK_COLOR;
      }

      const block = await prisma.promptBlock.create({
        data: dataToCreate
      });

      fastify.appLogger.business({
        action: 'Block Created',
        details: `block "${block.name}" of type ${block.type}`,
        resourceId: block.id
      });

      return block;
    } catch (error) {
      fastify.appLogger.error(`Failed to create block: ${error}`);
      return reply.status(500).send({ error: 'Failed to create block' });
    }
  });

  // PUT /api/blocks/:id - Mettre à jour un bloc
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      content?: string;
      type?: PromptBlockType;
      category?: string;
      color?: string;
    }
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, content, type, category, color } = request.body;

      const existingBlock = await prisma.promptBlock.findUnique({
        where: { id }
      });

      if (!existingBlock) {
        return reply.status(404).send({ error: 'Block not found' });
      }

      if (existingBlock.systemBehavior === 'NONE' && category?.trim() === SYSTEM_CATEGORY_NAME) {
        return reply.status(403).send({ error: `The category "${SYSTEM_CATEGORY_NAME}" is reserved for system blocks.` });
      }

      if (existingBlock.systemBehavior !== 'NONE' && type && type !== existingBlock.type) {
        return reply.status(403).send({ error: "Cannot change the type of a system block." });
      }

      // Validation des couleurs réservées
      const SYSTEM_BLOCK_COLOR = '#8B5CF6';
      const DYNAMIC_TASK_BLOCK_COLOR = '#EF4444';
      const RESERVED_COLORS = [SYSTEM_BLOCK_COLOR, DYNAMIC_TASK_BLOCK_COLOR];
      if (color && RESERVED_COLORS.includes(color) && existingBlock.systemBehavior === 'NONE') {
        return reply.status(403).send({ error: 'This color is reserved for system blocks.' });
      }

      const updatedBlock = await prisma.promptBlock.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(content !== undefined && { content }),
          ...(type !== undefined && { type }),
          ...(category !== undefined && { category: category || null }),
          ...(color !== undefined && { color: color || null })
        }
      });

      fastify.appLogger.business({
        action: 'Block Updated',
        details: `block "${updatedBlock.name}"`,
        resourceId: updatedBlock.id
      });

      return updatedBlock;
    } catch (error) {
      fastify.appLogger.error(`Failed to update block ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to update block' });
    }
  });

  // DELETE /api/blocks/:id - Supprimer un bloc
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const existingBlock = await prisma.promptBlock.findUnique({
        where: { id }
      });

      if (!existingBlock) {
        return reply.status(404).send({ error: 'Block not found' });
      }

      if (existingBlock.systemBehavior === 'INDELETABLE') {
        return reply.status(403).send({ error: 'This core system block cannot be deleted.' });
      }

      await prisma.promptBlock.delete({
        where: { id }
      });

      fastify.appLogger.business({
        action: 'Block Deleted',
        details: `block "${existingBlock.name}"`,
        resourceId: existingBlock.id
      });

      return { message: 'Block deleted successfully' };
    } catch (error) {
      fastify.appLogger.error(`Failed to delete block ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to delete block' });
    }
  });

  // GET /api/blocks/categories - Récupérer toutes les catégories uniques
  fastify.get('/categories', async (request, reply) => {
    try {
      const result = await prisma.promptBlock.findMany({
        select: { category: true },
        distinct: ['category'],
        where: {
          category: { not: null }
        }
      });

      const categories = result
        .map(r => r.category)
        .filter(Boolean)
        .sort();

      return categories;
    } catch (error) {
      fastify.appLogger.error(`Failed to fetch categories: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch categories' });
    }
  });
};
