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

  // Nouvel endpoint pour arrêter la surveillance
  fastify.post<{
    Body: {
      path: string;
    }
  }>('/unwatch', async (request, reply) => {
    try {
      const { path } = request.body;

      if (!path) {
        return reply.status(400).send({ error: 'Parameter "path" is required' });
      }

      watchService.stopWatching(path);
      fastify.appLogger.info(`Agent stopped watching path: ${path}`);
      
      return reply.status(200).send({ message: 'Watch stopped successfully' });
    } catch (error) {
      const err = error as Error;
      fastify.appLogger.error(`Failed to stop watcher: ${err.message}`);
      return reply.status(500).send({ error: 'Failed to stop watcher' });
    }
  });
};
