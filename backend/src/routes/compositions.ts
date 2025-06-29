import { FastifyPluginAsync } from 'fastify';
import { compositionController } from '../controllers/composition.controller';
import {
  compositionIdParamSchema,
  createCompositionBodySchema,
  updateCompositionBodySchema,
  CompositionIdParam,
  CreateCompositionBody,
  UpdateCompositionBody,
} from '../schemas/composition.schema';

export const compositionsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/compositions - Récupérer toutes les compositions
  fastify.get('/', compositionController.getAllCompositionsHandler.bind(compositionController));

  // GET /api/compositions/:id - Récupérer une composition spécifique
  fastify.get<{ Params: CompositionIdParam }>(
    '/:id',
    { schema: { params: compositionIdParamSchema } },
    compositionController.getCompositionByIdHandler.bind(compositionController)
  );

  // POST /api/compositions - Créer une nouvelle composition
  fastify.post<{ Body: CreateCompositionBody }>(
    '/',
    { schema: { body: createCompositionBodySchema } },
    compositionController.createCompositionHandler.bind(compositionController)
  );

  // PUT /api/compositions/:id - Mettre à jour une composition
  fastify.put<{
    Params: CompositionIdParam;
    Body: UpdateCompositionBody;
  }>(
    '/:id',
    {
      schema: {
        params: compositionIdParamSchema,
        body: updateCompositionBodySchema
      }
    },
    compositionController.updateCompositionHandler.bind(compositionController)
  );

  // DELETE /api/compositions/:id - Supprimer une composition
  fastify.delete<{ Params: CompositionIdParam }>(
    '/:id',
    { schema: { params: compositionIdParamSchema } },
    compositionController.deleteCompositionHandler.bind(compositionController)
  );
};