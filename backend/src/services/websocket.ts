import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import * as chokidar from 'chokidar';
import { logger } from './logger';

interface WatcherInfo {
  watcher: chokidar.FSWatcher;
  workspaceId: string;
}

const activeWatchers = new Map<string, WatcherInfo>();

export function setupWebSocket(io: Server, prisma: PrismaClient) {
  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // Handle workspace selection for file watching
    socket.on('watch-workspace', async (data: { workspaceId: string }) => {
      try {
        const { workspaceId } = data;

        // Stop any existing watcher for this socket
        const existingWatcher = activeWatchers.get(socket.id);
        if (existingWatcher) {
          await existingWatcher.watcher.close();
          activeWatchers.delete(socket.id);
        }

        // Get workspace details
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId }
        });

        if (!workspace) {
          socket.emit('error', { message: 'Workspace not found' });
          return;
        }

        // Get global ignore patterns
        const settings = await prisma.setting.findFirst({
          where: { id: 1 }
        });

        const globalIgnorePatterns = settings?.globalIgnorePatterns || [];
        const workspaceIgnorePatterns = workspace.ignorePatterns || [];
        const allIgnorePatterns = [...globalIgnorePatterns, ...workspaceIgnorePatterns];

        // Create file watcher
        const watcher = chokidar.watch(workspace.path, {
          ignored: (path: string) => {
            // Convert ignore patterns to chokidar format
            for (const pattern of allIgnorePatterns) {
              if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                if (regex.test(path)) {
                  return true;
                }
              } else if (path.includes(pattern)) {
                return true;
              }
            }
            return false;
          },
          persistent: true,
          ignoreInitial: true
        });

        // Set up event handlers
        watcher
          .on('add', (path) => {
            socket.emit('filesystem:change', {
              type: 'add',
              path: path,
              workspaceId
            });
          })
          .on('unlink', (path) => {
            socket.emit('filesystem:change', {
              type: 'unlink',
              path: path,
              workspaceId
            });
          })
          .on('addDir', (path) => {
            socket.emit('filesystem:change', {
              type: 'addDir',
              path: path,
              workspaceId
            });
          })
          .on('unlinkDir', (path) => {
            socket.emit('filesystem:change', {
              type: 'unlinkDir',
              path: path,
              workspaceId
            });
          })
          .on('change', (path) => {
            socket.emit('filesystem:change', {
              type: 'change',
              path: path,
              workspaceId
            });
          })
          .on('error', (error) => {
            logger.error(`File watcher error for workspace ${workspaceId}: ${error}`);
            socket.emit('error', { message: 'File watcher error', error: error.message });
          });

        // Store the watcher
        activeWatchers.set(socket.id, { watcher, workspaceId });

        socket.emit('watch-started', { workspaceId });
        logger.success(`File watcher started for workspace ${workspaceId} (client: ${socket.id})`);

      } catch (error) {
        logger.error(`Failed to setup workspace watcher: ${error}`);
        socket.emit('error', { message: 'Failed to start watching workspace' });
      }
    });

    // Handle stopping workspace watching
    socket.on('stop-watch', async () => {
      const watcherInfo = activeWatchers.get(socket.id);
      if (watcherInfo) {
        await watcherInfo.watcher.close();
        activeWatchers.delete(socket.id);
        socket.emit('watch-stopped');
        logger.info(`File watcher stopped for workspace ${watcherInfo.workspaceId} (client: ${socket.id})`);
      }
    });

    // Handle client disconnect
    socket.on('disconnect', async () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
      
      // Clean up any active watchers
      const watcherInfo = activeWatchers.get(socket.id);
      if (watcherInfo) {
        await watcherInfo.watcher.close();
        activeWatchers.delete(socket.id);
        logger.info(`File watcher cleaned up for workspace ${watcherInfo.workspaceId} (disconnected client: ${socket.id})`);
      }
    });
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Closing all file watchers...');
    for (const [socketId, watcherInfo] of activeWatchers) {
      await watcherInfo.watcher.close();
    }
    activeWatchers.clear();
  });
}