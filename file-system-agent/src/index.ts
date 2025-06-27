import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/healthRoutes.js';
import { fileRoutes } from './routes/fileRoutes.js';
import { getConfig } from './config.js';

async function start() {
  const config = getConfig();
  
  // Créer l'instance Fastify
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    }
  });

  try {
    // Enregistrer le plugin CORS
    await fastify.register(cors, {
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    });

    // Enregistrer les routes
    await fastify.register(healthRoutes);
    await fastify.register(fileRoutes);

    // Route de base pour vérifier que l'agent fonctionne
    fastify.get('/', async (request, reply) => {
      return {
        name: 'File System Agent',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: 'GET /status',
          structure: 'GET /structure?path=<path>&ignorePatterns=<patterns>',
          fileContent: 'POST /files/content'
        }
      };
    });

    // Démarrer le serveur
    await fastify.listen({
      port: config.port,
      host: config.host
    });

    console.log(`🚀 Agent de système de fichiers démarré sur http://${config.host}:${config.port}`);
    console.log(`📁 Prêt à servir les fichiers du système local`);
    console.log(`🔧 CORS configuré pour: ${config.corsOrigins.join(', ')}`);

  } catch (error) {
    fastify.log.error(error);
    console.error('❌ Erreur lors du démarrage de l\'agent:', error);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de l\'agent...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt de l\'agent...');
  process.exit(0);
});

// Démarrer l'agent
start().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});