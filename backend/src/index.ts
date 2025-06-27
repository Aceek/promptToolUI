import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { workspaceRoutes } from './routes/workspaces';
import { formatRoutes } from './routes/formats';
import { roleRoutes } from './routes/roles';
import { settingRoutes } from './routes/settings';
import { promptRoutes } from './routes/prompt';
import { internalRoutes } from './routes/internal';
import { promptTemplateRoutes } from './routes/promptTemplates';
import { setupWebSocket } from './services/websocket';
import { logger } from './services/logger';

const prisma = new PrismaClient();

async function buildServer() {
  const fastify = Fastify({
    logger: false, // Désactivation du logger par défaut de Fastify
  });

  // Register CORS
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true
  });

  // Register Socket.IO
  const io = new Server(fastify.server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : true,
      credentials: true
    }
  });

  // Setup WebSocket handlers
  setupWebSocket(io, prisma);

  // Make prisma, io and logger available in request context
  fastify.decorate('prisma', prisma);
  fastify.decorate('io', io);
  fastify.decorate('appLogger', logger);

  // Pas de logging HTTP automatique - seulement les logs métier dans les routes

  // Register routes
  await fastify.register(workspaceRoutes, { prefix: '/api/workspaces' });
  await fastify.register(formatRoutes, { prefix: '/api/formats' });
  await fastify.register(roleRoutes, { prefix: '/api/roles' });
  await fastify.register(settingRoutes, { prefix: '/api/settings' });
  await fastify.register(promptRoutes, { prefix: '/api/prompt' });
  await fastify.register(internalRoutes, { prefix: '/api/internal' });
  await fastify.register(promptTemplateRoutes, { prefix: '/api/prompt-templates' });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return fastify;
}

// Start server
async function start() {
  try {
    const fastify = await buildServer();
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    logger.success('Backend server running on http://localhost:3001');
  } catch (err) {
    logger.error(`Failed to start server: ${err}`);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Type declarations for Fastify decorators
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    io: Server;
    appLogger: typeof logger;
  }
}
