import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { workspaceRoutes } from './routes/workspaces';
import { settingRoutes } from './routes/settings';
import { promptRoutes } from './routes/prompt';
import { internalRoutes } from './routes/internal';
import { blocksRoutes } from './routes/blocks';
import { compositionsRoutes } from './routes/compositions';
import { setupWebSocket } from './services/websocket';
import { logger } from './services/logger';

const prisma = new PrismaClient();

async function buildServer() {
  const fastify = Fastify({
    logger: false, // Désactivation du logger par défaut de Fastify
  }).withTypeProvider<ZodTypeProvider>();

  // Configurer les compilateurs Zod
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

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
  await fastify.register(settingRoutes, { prefix: '/api/settings' });
  await fastify.register(promptRoutes, { prefix: '/api/prompt' });
  await fastify.register(internalRoutes, { prefix: '/api/internal' });
  
  // New modular routes
  await fastify.register(blocksRoutes, { prefix: '/api/blocks' });
  await fastify.register(compositionsRoutes, { prefix: '/api/compositions' });

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
