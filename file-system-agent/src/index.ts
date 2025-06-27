import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/healthRoutes';
import { fileRoutes } from './routes/fileRoutes';
import { watchRoutes } from './routes/watchRoutes';
import { getConfig } from './config';
import { logger } from './logger';

async function start() {
  const config = getConfig();
  
  // Créer l'instance Fastify avec logging complètement désactivé
  const fastify = Fastify({
    logger: false,
    disableRequestLogging: true
  });

  try {
    // Décorer l'instance avec notre logger
    fastify.decorate('appLogger', logger);

    // Pas de logging HTTP automatique - seulement les logs métier dans les routes

    // Enregistrer le plugin CORS
    await fastify.register(cors, {
      origin: true, // Accepte n'importe quelle origine
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    });

        // Enregistrer les routes
    await fastify.register(healthRoutes);
    await fastify.register(fileRoutes);
    await fastify.register(watchRoutes);

    // Route de base pour vérifier que l'agent fonctionne
    fastify.get('/', async (request, reply) => {
      return {
        name: 'File System Agent',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: 'GET /status',
          structure: 'GET /structure?path=<path>&ignorePatterns=<patterns>',
          fileContent: 'POST /files/content',
          watch: 'POST /watch'
        }
      };
    });

    // Démarrer le serveur
    await fastify.listen({
      port: config.port,
      host: config.host
    });

    logger.success(`Agent de système de fichiers démarré sur http://${config.host}:${config.port}`);
    logger.info(`Prêt à servir les fichiers du système local`);
    logger.info(`CORS configuré pour: ${config.corsOrigins.join(', ')}`);

  } catch (error) {
    logger.error(`Erreur lors du démarrage de l'agent: ${error}`);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  logger.info('Arrêt de l\'agent...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Arrêt de l\'agent...');
  process.exit(0);
});

// Démarrer l'agent
start().catch((error) => {
  logger.error(`Erreur fatale: ${error}`);
  process.exit(1);
});

// Type declarations for Fastify decorators
declare module 'fastify' {
  interface FastifyInstance {
    appLogger: typeof logger;
  }
}
