import * as chokidar from 'chokidar';
import path from 'path';
import { logger } from '../logger';

// Un Map pour s'assurer qu'on n'a qu'un seul watcher par chemin.
const activeWatchers = new Map<string, chokidar.FSWatcher>();

export class WatchService {
  public startWatching(watchPath: string, callbackUrl: string, ignorePatterns: string[]) {
    if (activeWatchers.has(watchPath)) {
      logger.info(`Watcher is already active for path: ${watchPath}`);
      return;
    }

    logger.info(`Initializing new watcher for path: ${watchPath}`);
    logger.info(`Notifications will be sent to: ${callbackUrl}`);

    const watcher = chokidar.watch(watchPath, {
      ignored: [...ignorePatterns, /(^|[\/\\])\../], // Ignore les fichiers/dossiers cachés
      persistent: true,
      ignoreInitial: true,
      depth: 20,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    });

    activeWatchers.set(watchPath, watcher);

    const notifyBackend = async (eventType: string, changedPath: string) => {
      const relativePath = path.relative(watchPath, changedPath).replace(/\\/g, '/');
      logger.business({
        action: 'File Change Detected',
        details: `Type: ${eventType}, Path: ${relativePath}`,
        path: watchPath,
      });

      try {
        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: eventType, path: relativePath }),
        });
        if (!response.ok) {
           logger.error(`Backend notification failed with status ${response.status} for ${callbackUrl}`);
        } else {
           logger.success(`Backend notified successfully for ${relativePath}`);
        }
      } catch (error) {
        logger.error(`Failed to notify backend at ${callbackUrl}: ${error}`);
      }
    };

    watcher
      .on('add', (p) => notifyBackend('add', p))
      .on('unlink', (p) => notifyBackend('unlink', p))
      .on('addDir', (p) => notifyBackend('addDir', p))
      .on('unlinkDir', (p) => notifyBackend('unlinkDir', p))
      .on('error', (error) => logger.error(`Watcher error on ${watchPath}: ${error}`))
      .on('ready', () => logger.success(`Watcher is ready and scanning: ${watchPath}`));
  }
}

export const watchService = new WatchService();
