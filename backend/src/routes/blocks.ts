import { FastifyPluginAsync } from 'fastify';
import { blockController } from '../controllers/block.controller';
import {
  blockIdParamSchema,
  createBlockBodySchema,
  updateBlockBodySchema,
  BlockIdParam,
  CreateBlockBody,
  UpdateBlockBody,
} from '../schemas/block.schema';

export const blocksRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/blocks - Récupérer tous les blocs
  fastify.get('/', blockController.getAllBlocksHandler.bind(blockController));

  // GET /api/blocks/:id - Récupérer un bloc spécifique
  fastify.get<{ Params: BlockIdParam }>(
    '/:id',
    { schema: { params: blockIdParamSchema } },
    blockController.getBlockByIdHandler.bind(blockController)
  );

  // POST /api/blocks - Créer un nouveau bloc
  fastify.post<{ Body: CreateBlockBody }>(
    '/',
    { schema: { body: createBlockBodySchema } },
    blockController.createBlockHandler.bind(blockController)
  );

  // PUT /api/blocks/:id - Mettre à jour un bloc
  fastify.put<{
    Params: BlockIdParam;
    Body: UpdateBlockBody;
  }>(
    '/:id',
    {
      schema: {
        params: blockIdParamSchema,
        body: updateBlockBodySchema
      }
    },
    blockController.updateBlockHandler.bind(blockController)
  );

  // DELETE /api/blocks/:id - Supprimer un bloc
  fastify.delete<{ Params: BlockIdParam }>(
    '/:id',
    { schema: { params: blockIdParamSchema } },
    blockController.deleteBlockHandler.bind(blockController)
  );

  // GET /api/blocks/categories - Récupérer toutes les catégories uniques
  fastify.get('/categories', blockController.getCategoriesHandler.bind(blockController));
};