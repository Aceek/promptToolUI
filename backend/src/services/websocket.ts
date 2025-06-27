import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const agentUrl = process.env.AGENT_URL || 'http://host.docker.internal:4001';

// L'URL que l'agent (sur l'hôte) doit appeler pour joindre le backend (dans Docker)
// CORRECTION: L'agent tourne sur l'hôte et doit accéder au backend via localhost (port exposé)
const backendCallbackBaseUrl = process.env.BACKEND_CALLBACK_URL || 'http://localhost:3001';

export function setupWebSocket(io: Server, prisma: PrismaClient) {
  io.on('connection', (socket: Socket) => {
    logger.info(`[DIAGNOSTIC] WebSocket client connected: ${socket.id}`);
    const subscriptions = new Set<string>();

    socket.on('watch-workspace', async (data: { workspaceId: string }) => {
      try {
        const { workspaceId } = data;
        
        // LOG DIAGNOSTIC: Vérifier la room avant et après join
        logger.info(`[DIAGNOSTIC] Socket ${socket.id} joining workspace room: ${workspaceId}`);
        socket.join(workspaceId);
        subscriptions.add(workspaceId);
        
        const roomSockets = await io.in(workspaceId).fetchSockets();
        logger.info(`[DIAGNOSTIC] Room ${workspaceId} now has ${roomSockets.length} clients: ${roomSockets.map(s => s.id).join(', ')}`);

        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (!workspace) {
          socket.emit('error', { message: `Workspace not found.` });
          return;
        }

        const settings = await prisma.setting.findFirst({ where: { id: 1 } });
        const ignorePatterns = [
          ...(settings?.globalIgnorePatterns || []),
          ...(workspace.ignorePatterns || [])
        ];
        
        // MODIFICATION : Construire l'URL de callback
        const callbackUrl = `${backendCallbackBaseUrl}/api/internal/workspaces/${workspace.id}/notify-change`;

        // LOG DIAGNOSTIC: Afficher les détails de la requête à l'agent
        logger.info(`[DIAGNOSTIC] Requesting agent to watch path: ${workspace.path}`);
        logger.info(`[DIAGNOSTIC] Agent URL: ${agentUrl}/watch`);
        logger.info(`[DIAGNOSTIC] Callback URL: ${callbackUrl}`);
        logger.info(`[DIAGNOSTIC] Ignore patterns: ${ignorePatterns.length} patterns`);

        const agentResponse = await fetch(`${agentUrl}/watch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // MODIFICATION : Envoyer la callbackUrl à l'agent
          body: JSON.stringify({ path: workspace.path, callbackUrl, ignorePatterns }),
        });

        if (!agentResponse.ok) {
          const errorText = await agentResponse.text();
          logger.error(`[DIAGNOSTIC] Agent watch request failed: ${agentResponse.status} - ${errorText}`);
          throw new Error(`Agent responded with ${agentResponse.status}: ${errorText}`);
        }

        logger.success(`[DIAGNOSTIC] Client ${socket.id} started watching workspace ${workspace.name}`);
        socket.emit('watch-started', { workspaceId });

      } catch (error) {
        logger.error(`[DIAGNOSTIC] Failed to ask agent to watch: ${error}`);
        socket.emit('error', { message: 'Failed to start watching workspace. Is the agent running?' });
      }
    });

    socket.on('stop-watch', () => {
      subscriptions.forEach(workspaceId => socket.leave(workspaceId));
      subscriptions.clear();
      socket.emit('watch-stopped');
      logger.info(`Client ${socket.id} stopped watching all workspaces.`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });
}