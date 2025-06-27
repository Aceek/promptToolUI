import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

export const settingRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;

  // GET /api/settings - Get global settings
  fastify.get('/', async (request, reply) => {
    try {
      let settings = await prisma.setting.findFirst({
        where: { id: 1 }
      });

      // Create default settings if they don't exist
      if (!settings) {
        settings = await prisma.setting.create({
          data: {
            id: 1,
            globalIgnorePatterns: [
              '*.log',
              '*.logs',
              '*.jpg',
              '*.jpeg',
              '*.png',
              '*.gif',
              '*.svg',
              '*.ico',
              '*.bmp',
              '*.tiff',
              '*.webp',
              '*.mp3',
              '*.wav',
              '*.mp4',
              '*.avi',
              '*.mov',
              '*.zip',
              '*.tar',
              '*.gz',
              '*.7z',
              '*.rar',
              '*.pdf',
              '*.doc',
              '*.docx',
              '*.xls',
              '*.xlsx',
              '*.ppt',
              '*.pptx',
              '*.exe',
              '*.dll',
              '*.so',
              '*.o',
              '*.a',
              '*.class',
              '*.jar',
              '*.war',
              '*.ear',
              '*.pyc',
              '*.pyo',
              '*.pyd',
              '*.db',
              '*.sqlite',
              '*.sqlite3',
              '*.db3',
              '*.sql',
              '*.bak',
              '*.tmp',
              '*.temp',
              '*.swp',
              '*.swo',
              '*.DS_Store',
              '*.idea',
              '*.vscode',
              '*.git',
              '*.svn',
              '*.hg',
              '*.bzr',
              '*.env',
              '*.env.*',
              '*.csv',
              'data',
              '.git',
              '.github',
              '.vscode',
              '.idea',
              '.husky',
              'venv',
              'node_modules',
              'dist',
              'build',
              'coverage',
              '.cache',
              'out/',
              'yarn.lock',
              'package-lock.json',
              'translations/*.json',
              'translations/'
            ]
          }
        });
      }

      return settings;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch settings' });
    }
  });

  // PUT /api/settings - Update global settings
  fastify.put<{
    Body: {
      globalIgnorePatterns?: string[];
    }
  }>('/', async (request, reply) => {
    try {
      const { globalIgnorePatterns } = request.body;

      const settings = await prisma.setting.upsert({
        where: { id: 1 },
        update: {
          globalIgnorePatterns: globalIgnorePatterns || []
        },
        create: {
          id: 1,
          globalIgnorePatterns: globalIgnorePatterns || []
        }
      });

      return settings;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update settings' });
    }
  });
};