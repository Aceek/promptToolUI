import { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /status - Vérifier si l'agent est en cours d'exécution
  fastify.get('/status', async (request, reply) => {
    return { status: 'running' };
  });
};