import { FastifyPluginAsync } from 'fastify';

export const internalRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/internal/workspaces/:id/notify-change
  // Cet endpoint est appelé par le file-system-agent pour notifier d'un changement.
  fastify.post<{
    Params: { id: string },
    Body: { type: string, path: string }
  }>('/workspaces/:id/notify-change', async (request, reply) => {
    try {
      const workspaceId = request.params.id;
      const { type, path } = request.body;

      fastify.appLogger.business({
        action: 'Filesystem Change Received from Agent',
        details: `Type: ${type}, Path: ${path}`,
        resourceId: workspaceId
      });

      // Diffuser le changement à tous les clients écoutant ce workspace
      fastify.io.to(workspaceId).emit('filesystem:change', {
        type,
        path,
        workspaceId,
      });

      return reply.status(204).send();
    } catch (error) {
      fastify.appLogger.error(`Error processing filesystem notification: ${error}`);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
};
