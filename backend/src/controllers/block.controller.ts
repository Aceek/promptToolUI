import { FastifyRequest, FastifyReply } from 'fastify';
import { PromptBlockType } from '@prisma/client';
import { blockService } from '../services/block.service';
import {
  BlockIdParam,
  CreateBlockBody,
  UpdateBlockBody,
} from '../schemas/block.schema';
import { SYSTEM_CATEGORY_NAME, SYSTEM_BLOCK_COLOR, DYNAMIC_TASK_BLOCK_COLOR, RESERVED_COLORS } from '../constants';

export class BlockController {
  /**
   * Handler pour GET /api/blocks - Récupère tous les blocs
   */
  async getAllBlocksHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
      const blocks = await blockService.getAll();
      
      request.log.info({
        action: 'Blocks Listed',
        details: `${blocks.length} blocks retrieved`,
        resourceId: 'all'
      });
      
      return blocks;
    } catch (error) {
      request.log.error(`Failed to fetch blocks: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch blocks' });
    }
  }

  /**
   * Handler pour GET /api/blocks/:id - Récupère un bloc spécifique
   */
  async getBlockByIdHandler(
    request: FastifyRequest<{ Params: BlockIdParam }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const block = await blockService.getById(id);
      
      request.log.info({
        action: 'Block Retrieved',
        details: `block "${block.name}"`,
        resourceId: block.id
      });
      
      return block;
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'BLOCK_NOT_FOUND') {
        return reply.status(404).send({ error: 'Block not found' });
      }
      
      request.log.error(`Failed to fetch block ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch block' });
    }
  }

  /**
   * Handler pour POST /api/blocks - Crée un nouveau bloc
   */
  async createBlockHandler(
    request: FastifyRequest<{ Body: CreateBlockBody }>,
    reply: FastifyReply
  ) {
    try {
      const { category, color, type } = request.body;

      // Validation des règles d'interface - catégorie système
      if (category?.trim() === SYSTEM_CATEGORY_NAME) {
        return reply.status(403).send({ 
          error: `The category "${SYSTEM_CATEGORY_NAME}" is reserved for system blocks.` 
        });
      }

      // Validation des règles d'interface - couleurs réservées
      if (color && RESERVED_COLORS.includes(color) && type !== PromptBlockType.DYNAMIC_TASK) {
        return reply.status(403).send({ 
          error: 'This color is reserved for system blocks.' 
        });
      }

      const block = await blockService.create(request.body);
      
      request.log.info({
        action: 'Block Created',
        details: `block "${block.name}" of type ${block.type}`,
        resourceId: block.id
      });
      
      return block;
    } catch (error) {
      request.log.error(`Failed to create block: ${error}`);
      return reply.status(500).send({ error: 'Failed to create block' });
    }
  }

  /**
   * Handler pour PUT /api/blocks/:id - Met à jour un bloc
   */
  async updateBlockHandler(
    request: FastifyRequest<{
      Params: BlockIdParam;
      Body: UpdateBlockBody;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { category, color } = request.body;

      // Récupérer le bloc existant pour les validations d'interface
      const existingBlock = await blockService.getById(id);

      // Validation des règles d'interface - catégorie système
      if (existingBlock.systemBehavior === 'NONE' && category?.trim() === SYSTEM_CATEGORY_NAME) {
        return reply.status(403).send({ 
          error: `The category "${SYSTEM_CATEGORY_NAME}" is reserved for system blocks.` 
        });
      }

      // Validation des règles d'interface - couleurs réservées
      if (color && RESERVED_COLORS.includes(color) && existingBlock.systemBehavior === 'NONE') {
        return reply.status(403).send({ 
          error: 'This color is reserved for system blocks.' 
        });
      }

      const updatedBlock = await blockService.update(id, request.body);
      
      request.log.info({
        action: 'Block Updated',
        details: `block "${updatedBlock.name}"`,
        resourceId: updatedBlock.id
      });
      
      return updatedBlock;
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'BLOCK_NOT_FOUND') {
        return reply.status(404).send({ error: 'Block not found' });
      }
      
      if (errorMessage === 'SYSTEM_BLOCK_TYPE_IMMUTABLE') {
        return reply.status(403).send({ error: "Cannot change the type of a system block." });
      }
      
      request.log.error(`Failed to update block ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to update block' });
    }
  }

  /**
   * Handler pour DELETE /api/blocks/:id - Supprime un bloc
   */
  async deleteBlockHandler(
    request: FastifyRequest<{ Params: BlockIdParam }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const deletedBlock = await blockService.remove(id);
      
      request.log.info({
        action: 'Block Deleted',
        details: `block "${deletedBlock.name}"`,
        resourceId: deletedBlock.id
      });
      
      return { message: 'Block deleted successfully' };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'BLOCK_NOT_FOUND') {
        return reply.status(404).send({ error: 'Block not found' });
      }
      
      if (errorMessage === 'SYSTEM_BLOCK_INDELETABLE') {
        return reply.status(403).send({ error: 'This core system block cannot be deleted.' });
      }
      
      request.log.error(`Failed to delete block ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to delete block' });
    }
  }

  /**
   * Handler pour GET /api/blocks/categories - Récupère toutes les catégories uniques
   */
  async getCategoriesHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
      const categories = await blockService.getCategories();
      return categories;
    } catch (error) {
      request.log.error(`Failed to fetch categories: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch categories' });
    }
  }
}

// Instance singleton du contrôleur
export const blockController = new BlockController();