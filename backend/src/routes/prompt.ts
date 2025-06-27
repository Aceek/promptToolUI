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
      
      return structure;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to generate structure' });
    }
  });

  // POST /api/prompt/generate - Generate final prompt
  fastify.post<{
    Body: {
      workspaceId: string;
      finalRequest: string;
      selectedFilePaths: string[];
      formatId: string;
      roleId: string;
    }
  }>('/generate', async (request, reply) => {
    try {
      const { workspaceId, finalRequest, selectedFilePaths, formatId, roleId } = request.body;

      // Fetch workspace
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId }
      });

      if (!workspace) {
        reply.status(404).send({ error: 'Workspace not found' });
        return;
      }

      // Fetch format
      const format = await prisma.format.findUnique({
        where: { id: formatId }
      });

      if (!format) {
        reply.status(404).send({ error: 'Format not found' });
        return;
      }

      // Fetch role
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        reply.status(404).send({ error: 'Role not found' });
        return;
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

      // Generate the prompt
      const prompt = await generatePrompt({
        workspace,
        format,
        role,
        finalRequest,
        selectedFilePaths,
        ignorePatterns: allIgnorePatterns
      });

      return { prompt };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to generate prompt' });
    }
  });
};