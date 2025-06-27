import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

export const promptTemplateRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;

  // GET /api/prompt-templates - List all templates
  fastify.get('/', async (request, reply) => {
    const templates = await prisma.promptTemplate.findMany({
      orderBy: { name: 'asc' },
    });
    return templates;
  });

  // POST /api/prompt-templates - Create a new template
  fastify.post<{ Body: { name: string; content: string } }>('/', async (request, reply) => {
    const { name, content } = request.body;
    const newTemplate = await prisma.promptTemplate.create({
      data: { name, content },
    });
    return reply.status(201).send(newTemplate);
  });
  
  // PUT /api/prompt-templates/:id - Update a template
  fastify.put<{ Params: { id: string }, Body: { name?: string; content?: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const updatedTemplate = await prisma.promptTemplate.update({
      where: { id },
      data: request.body,
    });
    return updatedTemplate;
  });

  // DELETE /api/prompt-templates/:id - Delete a template
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    // Empêcher la suppression du template par défaut
    const template = await prisma.promptTemplate.findUnique({ where: { id } });
    if (template?.isDefault) {
      return reply.status(400).send({ error: 'Cannot delete the default template.' });
    }
    await prisma.promptTemplate.delete({ where: { id } });
    return reply.status(204).send();
  });
};
