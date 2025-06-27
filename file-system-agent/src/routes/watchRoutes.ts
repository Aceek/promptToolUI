import { FastifyPluginAsync } from 'fastify';
import { watchService } from '../services/watchService';

export const watchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: {
      path: string;
      callbackUrl: string;
      ignorePatterns?: string[];
    }
  }>('/watch', async (request, reply) => {
    try {
      const { path, callbackUrl, ignorePatterns = [] } = request.body;

      fastify.appLogger.info(`Received request to watch path: ${path}`);

      if (!path || !callbackUrl) {
        return reply.status(400).send({ error: 'Parameters "path" and "callbackUrl" are required' });
      }

      watchService.startWatching(path, callbackUrl, ignorePatterns);
      
      return reply.status(202).send({ message: 'Watch request accepted' });
    } catch (error) {
      const err = error as Error;
      fastify.appLogger.error(`Failed to start watcher: ${err.message}`);
      return reply.status(500).send({ error: 'Failed to start watcher' });
    }
  });
};
