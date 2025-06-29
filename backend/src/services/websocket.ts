import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { AgentService } from './agentService';

// L'URL que l'agent (sur l'hôte) doit appeler pour joindre le backend (dans Docker)
// CORRECTION: L'agent tourne sur l'hôte et doit accéder au backend via localhost (port exposé)
const backendCallbackBaseUrl = process.env.BACKEND_CALLBACK_URL || 'http://localhost:3001';

// Map pour suivre le nombre de clients par workspace
const workspaceClientCount = new Map<string, number>();
const agentService = new AgentService();

export function setupWebSocket(io: Server, prisma: PrismaClient) {
  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);
    const subscriptions = new Set<string>();

    // Fonction pour gérer la déconnexion d'un client d'un workspace
    const handleStopWatching = async (workspaceId: string) => {
      const currentCount = workspaceClientCount.get(workspaceId);
      if (!currentCount) return;

      const newCount = currentCount - 1;
      if (newCount <= 0) {
        logger.info(`Last client for workspace ${workspaceId} disconnected. Requesting agent to stop watching.`);
        workspaceClientCount.delete(workspaceId);
        
        try {
          const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { path: true }
          });
          if (workspace) {
            await agentService.stopWatching(workspace.path);
          }
        } catch (error) {
          logger.error(`Failed to stop watching workspace ${workspaceId}: ${error}`);
        }
      } else {
        workspaceClientCount.set(workspaceId, newCount);
        logger.info(`Client disconnected from workspace ${workspaceId}. Remaining clients: ${newCount}`);
      }
    };

    socket.on('watch-workspace', async (data: { workspaceId: string }) => {
      try {
        const { workspaceId } = data;
        
        // Gérer les anciennes souscriptions pour ce socket
        for (const oldSubId of subscriptions) {
          if (oldSubId !== workspaceId) {
            socket.leave(oldSubId);
            await handleStopWatching(oldSubId);
          }
        }
        subscriptions.clear();
        
        socket.join(workspaceId);
        subscriptions.add(workspaceId);

        const currentCount = workspaceClientCount.get(workspaceId) || 0;
        workspaceClientCount.set(workspaceId, currentCount + 1);

        // Ne démarrer le watcher que si c'est le premier client
        if (currentCount === 0) {
          logger.info(`First client for workspace ${workspaceId}. Requesting agent to watch.`);
          
          const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
          if (!workspace) {
            socket.emit('error', { message: `Workspace not found.` });
            await handleStopWatching(workspaceId); // Annuler l'incrémentation
            return;
          }

          const settings = await prisma.setting.findFirst({ where: { id: 1 } });
          const ignorePatterns = [
            ...(settings?.globalIgnorePatterns || []),
            ...(workspace.ignorePatterns || [])
          ];
          
          const callbackUrl = `${backendCallbackBaseUrl}/api/internal/workspaces/${workspace.id}/notify-change`;

          try {
            await agentService.startWatching(workspace.path, callbackUrl, ignorePatterns);
            logger.success(`Client ${socket.id} started watching workspace ${workspace.name}`);
          } catch (error) {
            logger.error(`Failed to start watching: ${error}`);
            await handleStopWatching(workspaceId); // Annuler l'incrémentation
            socket.emit('error', { message: 'Failed to start watching workspace. Is the agent running?' });
            return;
          }
        } else {
          logger.info(`Additional client for workspace ${workspaceId}. Total clients: ${currentCount + 1}`);
        }

        socket.emit('watch-started', { workspaceId });

      } catch (error) {
        logger.error(`Failed to process watch-workspace: ${error}`);
        socket.emit('error', { message: 'Failed to start watching workspace.' });
      }
    });

    socket.on('stop-watch', async () => {
      for (const workspaceId of subscriptions) {
        socket.leave(workspaceId);
        await handleStopWatching(workspaceId);
      }
      subscriptions.clear();
      socket.emit('watch-stopped');
      logger.info(`Client ${socket.id} stopped watching all workspaces.`);
    });

    socket.on('disconnect', async () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
      // Quand un client se déconnecte, décrémenter le compteur pour toutes ses souscriptions
      for (const workspaceId of subscriptions) {
        await handleStopWatching(workspaceId);
      }
      subscriptions.clear();
    });
  });
}
