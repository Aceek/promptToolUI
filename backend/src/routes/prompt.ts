import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { generateStructure } from '../services/structure';
import { generatePrompt } from '../services/prompt';

export const promptRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;

  // GET /api/prompt/workspaces/:id/structure - Get workspace file structure
  fastify.get<{ Params: { id: string } }>('/workspaces/:id/structure', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const workspace = await prisma.workspace.findUnique({
        where: { id }
      });

      if (!workspace) {
        return reply.status(404).send({ error: 'Workspace not found' });
      }

      // Get global ignore patterns
      const settings = await prisma.setting.findFirst({
        where: { id: 1 }
      });

      const globalIgnorePatterns = settings?.globalIgnorePatterns || [];
      const workspaceIgnorePatterns = workspace.ignorePatterns || [];
      const allIgnorePatterns = [...globalIgnorePatterns, ...workspaceIgnorePatterns];

      const structure = await generateStructure(workspace.path, allIgnorePatterns);
      
      fastify.appLogger.business({
        action: 'Structure Generated',
        details: `for workspace "${workspace.name}"`,
        resourceId: workspace.id
      });
      return structure;
    } catch (error) {
      fastify.appLogger.error(`Failed to generate structure for workspace ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to generate structure' });
    }
  });

  // POST /api/prompt/generate - Generate final prompt using modular blocks
  fastify.post<{
    Body: {
      workspaceId: string;
      orderedBlockIds: string[]; // Liste ordonnée des IDs de blocs à assembler
      finalRequest?: string;
      selectedFilePaths?: string[];
    }
  }>('/generate', async (request, reply) => {
    try {
      const {
        workspaceId,
        orderedBlockIds,
        finalRequest = '',
        selectedFilePaths = []
      } = request.body;

      // Validation
      if (!orderedBlockIds || !Array.isArray(orderedBlockIds) || orderedBlockIds.length === 0) {
        return reply.status(400).send({ error: 'orderedBlockIds is required and must be a non-empty array' });
      }

      // Fetch workspace (required)
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId }
      });

      if (!workspace) {
        reply.status(404).send({ error: 'Workspace not found' });
        return;
      }

      // Vérifier que tous les blocs existent
      const blocks = await prisma.promptBlock.findMany({
        where: { id: { in: orderedBlockIds } }
      });

      if (blocks.length !== orderedBlockIds.length) {
        return reply.status(400).send({ error: 'Some blocks do not exist' });
      }

      // Get global ignore patterns
      const settings = await prisma.setting.findFirst({
        where: { id: 1 }
      });

      const globalIgnorePatterns = settings?.globalIgnorePatterns || [];
      const workspaceIgnorePatterns = workspace.ignorePatterns || [];
      const allIgnorePatterns = [...globalIgnorePatterns, ...workspaceIgnorePatterns];

      // Update workspace with last final request and selected files
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          lastFinalRequest: finalRequest,
          selectedFiles: selectedFilePaths
        }
      });

      fastify.appLogger.business({
        action: 'Modular Prompt Generation Started',
        details: `for workspace "${workspace.name}" with ${orderedBlockIds.length} blocks and ${selectedFilePaths.length} files`,
        resourceId: workspace.id
      });
      
      // Generate the prompt using the new modular system
      const prompt = await generatePrompt({
        prisma,
        workspace,
        orderedBlockIds,
        finalRequest,
        selectedFilePaths,
        ignorePatterns: allIgnorePatterns
      });

      fastify.appLogger.business({
        action: 'Modular Prompt Generated',
        details: `successfully for workspace "${workspace.name}"`,
        resourceId: workspace.id
      });
      
      return { prompt };
    } catch (error) {
      fastify.appLogger.error(`Failed to generate modular prompt for workspace ${request.body.workspaceId}: ${error}`);
      return reply.status(500).send({ error: 'Failed to generate prompt' });
    }
  });

  // POST /api/prompt/generate-from-composition - Generate prompt from a saved composition
  fastify.post<{
    Body: {
      workspaceId: string;
      compositionId: string;
      finalRequest?: string;
      selectedFilePaths?: string[];
    }
  }>('/generate-from-composition', async (request, reply) => {
    try {
      const { 
        workspaceId, 
        compositionId,
        finalRequest = '', 
        selectedFilePaths = []
      } = request.body;

      // Fetch workspace
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId }
      });

      if (!workspace) {
        return reply.status(404).send({ error: 'Workspace not found' });
      }

      // Fetch composition with blocks
      const composition = await prisma.promptComposition.findUnique({
        where: { id: compositionId },
        include: {
          blocks: {
            include: {
              block: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      if (!composition) {
        return reply.status(404).send({ error: 'Composition not found' });
      }

      // Extract ordered block IDs from composition
      const orderedBlockIds = composition.blocks.map(cb => cb.blockId);

      // Get global ignore patterns
      const settings = await prisma.setting.findFirst({
        where: { id: 1 }
      });

      const globalIgnorePatterns = settings?.globalIgnorePatterns || [];
      const workspaceIgnorePatterns = workspace.ignorePatterns || [];
      const allIgnorePatterns = [...globalIgnorePatterns, ...workspaceIgnorePatterns];

      // Update workspace
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          lastFinalRequest: finalRequest,
          selectedFiles: selectedFilePaths
        }
      });

      fastify.appLogger.business({
        action: 'Composition Prompt Generation Started',
        details: `for workspace "${workspace.name}" using composition "${composition.name}"`,
        resourceId: workspace.id
      });
      
      // Generate the prompt
      const prompt = await generatePrompt({
        prisma,
        workspace,
        orderedBlockIds,
        finalRequest,
        selectedFilePaths,
        ignorePatterns: allIgnorePatterns
      });

      fastify.appLogger.business({
        action: 'Composition Prompt Generated',
        details: `successfully for workspace "${workspace.name}" using composition "${composition.name}"`,
        resourceId: workspace.id
      });
      
      return { prompt, compositionName: composition.name };
    } catch (error) {
      fastify.appLogger.error(`Failed to generate prompt from composition: ${error}`);
      return reply.status(500).send({ error: 'Failed to generate prompt from composition' });
    }
  });
};
