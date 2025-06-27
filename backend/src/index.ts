import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { workspaceRoutes } from './routes/workspaces';
import { formatRoutes } from './routes/formats';
import { roleRoutes } from './routes/roles';
import { settingRoutes } from './routes/settings';
import { promptRoutes } from './routes/prompt';
import { setupWebSocket } from './services/websocket';

const prisma = new PrismaClient();

async function buildServer() {
  const fastify = Fastify({
    logger: process.env.NODE_ENV !== 'production' ? {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    } : true,
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

  // Make prisma and io available in request context
  fastify.decorate('prisma', prisma);
  fastify.decorate('io', io);

  // Register routes
  await fastify.register(workspaceRoutes, { prefix: '/api/workspaces' });
  await fastify.register(formatRoutes, { prefix: '/api/formats' });
  await fastify.register(roleRoutes, { prefix: '/api/roles' });
  await fastify.register(settingRoutes, { prefix: '/api/settings' });
  await fastify.register(promptRoutes, { prefix: '/api/prompt' });

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
    console.log('🚀 Backend server running on http://localhost:3001');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Type declarations for Fastify decorators
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    io: Server;
  }
}
