import { FastifyRequest, FastifyReply } from 'fastify';
import { compositionService } from '../services/composition.service';
import {
  CompositionIdParam,
  CreateCompositionBody,
  UpdateCompositionBody,
} from '../schemas/composition.schema';

export class CompositionController {
  /**
   * Handler pour GET /api/compositions - Récupère toutes les compositions
   */
  async getAllCompositionsHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
      const compositions = await compositionService.getAll();
      
      request.log.info({
        action: 'Compositions Listed',
        details: `${compositions.length} compositions retrieved`,
        resourceId: 'all'
      });
      
      return compositions;
    } catch (error) {
      request.log.error(`Failed to fetch compositions: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch compositions' });
    }
  }

  /**
   * Handler pour GET /api/compositions/:id - Récupère une composition spécifique
   */
  async getCompositionByIdHandler(
    request: FastifyRequest<{ Params: CompositionIdParam }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const composition = await compositionService.getById(id);
      
      request.log.info({
        action: 'Composition Retrieved',
        details: `composition "${composition.name}"`,
        resourceId: composition.id
      });
      
      return composition;
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'COMPOSITION_NOT_FOUND') {
        return reply.status(404).send({ error: 'Composition not found' });
      }
      
      request.log.error(`Failed to fetch composition ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch composition' });
    }
  }

  /**
   * Handler pour POST /api/compositions - Crée une nouvelle composition
   */
  async createCompositionHandler(
    request: FastifyRequest<{ Body: CreateCompositionBody }>,
    reply: FastifyReply
  ) {
    try {
      const composition = await compositionService.create(request.body);
      
      request.log.info({
        action: 'Composition Created',
        details: `composition "${composition.name}" with ${request.body.blockIds.length} blocks`,
        resourceId: composition.id
      });
      
      return composition;
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage.startsWith('CONFLICT:')) {
        const conflictMessage = errorMessage.replace('CONFLICT:', '');
        return reply.status(409).send({ error: conflictMessage });
      }
      
      if (errorMessage.startsWith('INVALID_BLOCKS:')) {
        const invalidMessage = errorMessage.replace('INVALID_BLOCKS:', '');
        return reply.status(400).send({ error: invalidMessage });
      }
      
      request.log.error(`Failed to create composition: ${error}`);
      return reply.status(500).send({ error: 'Failed to create composition' });
    }
  }

  /**
   * Handler pour PUT /api/compositions/:id - Met à jour une composition
   */
  async updateCompositionHandler(
    request: FastifyRequest<{
      Params: CompositionIdParam;
      Body: UpdateCompositionBody;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const updatedComposition = await compositionService.update(id, request.body);
      
      request.log.info({
        action: 'Composition Updated',
        details: `composition "${updatedComposition?.name}"`,
        resourceId: id
      });
      
      return updatedComposition;
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'COMPOSITION_NOT_FOUND') {
        return reply.status(404).send({ error: 'Composition not found' });
      }
      
      if (errorMessage.startsWith('CONFLICT:')) {
        const conflictMessage = errorMessage.replace('CONFLICT:', '');
        return reply.status(409).send({ error: conflictMessage });
      }
      
      if (errorMessage.startsWith('INVALID_BLOCKS:')) {
        const invalidMessage = errorMessage.replace('INVALID_BLOCKS:', '');
        return reply.status(400).send({ error: invalidMessage });
      }
      
      request.log.error(`Failed to update composition ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to update composition' });
    }
  }

  /**
   * Handler pour DELETE /api/compositions/:id - Supprime une composition
   */
  async deleteCompositionHandler(
    request: FastifyRequest<{ Params: CompositionIdParam }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const deletedComposition = await compositionService.remove(id);
      
      request.log.info({
        action: 'Composition Deleted',
        details: `composition "${deletedComposition.name}"`,
        resourceId: deletedComposition.id
      });
      
      return { message: 'Composition deleted successfully' };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'COMPOSITION_NOT_FOUND') {
        return reply.status(404).send({ error: 'Composition not found' });
      }
      
      request.log.error(`Failed to delete composition ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to delete composition' });
    }
  }
}

// Instance singleton du contrôleur
export const compositionController = new CompositionController();