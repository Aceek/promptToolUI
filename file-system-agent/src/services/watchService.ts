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

      // LOG DIAGNOSTIC: Afficher l'URL de callback utilisée
      logger.info(`[DIAGNOSTIC] Attempting to notify backend at: ${callbackUrl}`);
      logger.info(`[DIAGNOSTIC] Payload: ${JSON.stringify({ type: eventType, path: relativePath })}`);

      try {
        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: eventType, path: relativePath }),
        });
        if (!response.ok) {
           const responseText = await response.text();
           logger.error(`[DIAGNOSTIC] Backend notification failed with status ${response.status} for ${callbackUrl}. Response: ${responseText}`);
        } else {
           logger.success(`[DIAGNOSTIC] Backend notified successfully for ${relativePath}. Status: ${response.status}`);
        }
      } catch (error) {
        logger.error(`[DIAGNOSTIC] Network error when notifying backend at ${callbackUrl}: ${error}`);
        logger.error(`[DIAGNOSTIC] Error details: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    watcher
      .on('add', (p) => {
        logger.info(`[DIAGNOSTIC] Chokidar detected file ADD: ${p}`);
        notifyBackend('add', p);
      })
      .on('unlink', (p) => {
        logger.info(`[DIAGNOSTIC] Chokidar detected file UNLINK: ${p}`);
        notifyBackend('unlink', p);
      })
      .on('addDir', (p) => {
        logger.info(`[DIAGNOSTIC] Chokidar detected directory ADD: ${p}`);
        notifyBackend('addDir', p);
      })
      .on('unlinkDir', (p) => {
        logger.info(`[DIAGNOSTIC] Chokidar detected directory UNLINK: ${p}`);
        notifyBackend('unlinkDir', p);
      })
      .on('change', (p) => {
        logger.info(`[DIAGNOSTIC] Chokidar detected file CHANGE: ${p}`);
        notifyBackend('change', p);
      })
      .on('error', (error) => logger.error(`[DIAGNOSTIC] Watcher error on ${watchPath}: ${error}`))
      .on('ready', () => {
        logger.success(`[DIAGNOSTIC] Watcher is ready and scanning: ${watchPath}`);
        logger.info(`[DIAGNOSTIC] Watcher configuration: ignored patterns count = ${ignorePatterns.length}`);
      });
  }
}

export const watchService = new WatchService();
