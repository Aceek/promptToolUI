import * as chokidar from 'chokidar';
import path from 'path';
import { logger } from '../logger';

// Un Map pour s'assurer qu'on n'a qu'un seul watcher par chemin.
const activeWatchers = new Map<string, chokidar.FSWatcher>();

export class WatchService {
  public startWatching(watchPath: string, callbackUrl: string, ignorePatterns: string[]) {
    if (activeWatchers.has(watchPath)) {
      return;
    }


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

      try {
        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: eventType, path: relativePath }),
        });
        if (!response.ok) {
           const responseText = await response.text();
           logger.error(`Backend notification failed with status ${response.status} for ${callbackUrl}. Response: ${responseText}`);
        } else {
           // Removed diagnostic log for successful notification
        }
      } catch (error) {
        logger.error(`Network error when notifying backend at ${callbackUrl}: ${error}`);
        logger.error(`Error details: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    watcher
      .on('add', (p) => {
        notifyBackend('add', p);
      })
      .on('unlink', (p) => {
        notifyBackend('unlink', p);
      })
      .on('addDir', (p) => {
        notifyBackend('addDir', p);
      })
      .on('unlinkDir', (p) => {
        notifyBackend('unlinkDir', p);
      })
      .on('error', (error) => logger.error(`Watcher error on ${watchPath}: ${error}`))
      .on('ready', () => {
      });
  }

  public stopWatching(watchPath: string) {
    const watcher = activeWatchers.get(watchPath);
    if (watcher) {
      watcher.close().then(() => {
        logger.info(`Successfully closed watcher for path: ${watchPath}`);
      }).catch((error) => {
        logger.error(`Error closing watcher for path ${watchPath}: ${error}`);
      });
      activeWatchers.delete(watchPath);
      logger.info(`Watcher removed from active watchers for path: ${watchPath}`);
    } else {
      logger.warn(`No active watcher found for path: ${watchPath}`);
    }
  }

  public getActiveWatchersCount(): number {
    return activeWatchers.size;
  }

  public getActiveWatcherPaths(): string[] {
    return Array.from(activeWatchers.keys());
  }
}

export const watchService = new WatchService();
